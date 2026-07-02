# ProLign RAG Chatbot Backend

This project replaces the old n8n-based ProLign chatbot workflow with a clean Python FastAPI backend. The chatbot supports FAQ answering through RAG, conversation memory through Supabase, Groq-powered intent classification and final answers, Jina AI embeddings, Supabase pgvector search, and Slack escalation for complaints.

The React chatbot component was also updated so it calls the new FastAPI endpoint instead of the n8n webhook.

## What Changed

The old architecture was:

```text
React frontend
-> n8n webhook
-> n8n nodes for Groq, Jina, Supabase, Slack, and memory
-> response back to React
```

The new architecture is:

```text
React frontend
-> FastAPI POST /chat
-> intent classification
-> FAQ route or complaint route
-> Supabase memory save
-> response back to React
```

The main reason for this change is that n8n was acting as the full backend orchestration layer. That made the chatbot dependent on n8n pricing, n8n workflow availability, exported credentials, and low-code node behavior. The new implementation moves that behavior into normal backend code, which is easier to version, review, test, deploy, secure, and extend.

## Files Added

```text
prolign-chatbot/
|-- main.py
|-- config.py
|-- intent_classifier.py
|-- embedder.py
|-- vector_search.py
|-- rag_chain.py
|-- complaint_handler.py
|-- memory.py
|-- schemas.py
|-- requirements.txt
|-- .env.example
`-- README.md
```

Frontend output:

```text
RAGChatbot.jsx
```

The original `env.js` file was left unchanged because it belongs to the existing Node.js backend. The Python chatbot backend has its own configuration file: `prolign-chatbot/config.py`.

## How The Backend Is Organized

`main.py` creates the FastAPI app, configures CORS, exposes the health check, and implements the `POST /chat` endpoint.

`config.py` loads environment variables from `.env` using `python-dotenv`. It validates required variables at startup and provides defaults for optional settings.

`schemas.py` defines the request and response models. The backend accepts `session_id` and `message`, and returns `reply` and `intent`.

`intent_classifier.py` calls Groq with a small classification prompt and returns either `FAQ` or `COMPLAINT`.

`embedder.py` calls Jina AI Embeddings API and returns an embedding vector for the user's message.

`vector_search.py` calls the Supabase `match_faqs` RPC function to retrieve the most relevant FAQ chunks.

`rag_chain.py` loads recent conversation history, builds the RAG prompt, and asks Groq to generate the final FAQ answer.

`complaint_handler.py` sends complaint messages to Slack using an incoming webhook.

`memory.py` loads and saves conversation history in Supabase using the `conversation_history` table.

## Why Each Change Was Made

The backend was split into small modules so each responsibility is isolated. This makes the code easier to debug: if embeddings fail, the issue is in `embedder.py`; if Slack fails, the issue is in `complaint_handler.py`; if memory fails, the issue is in `memory.py`.

All external calls use `httpx.AsyncClient` because the requirement was to use async I/O and avoid synchronous HTTP libraries.

Secrets are not hardcoded. Groq, Jina, Supabase, and Slack credentials are read from `.env`. This is safer than the n8n export because exported workflows can accidentally expose credentials or service URLs.

The frontend now sends a stable `session_id` so the backend can store and retrieve conversation history. Logged-in users use their user id. Anonymous users get a browser-local UUID stored in `localStorage`.

The response contract was changed from n8n-style fields such as `output`, `text`, or `message` to the backend's clean response shape: `data.reply`.

## API Contract

Health check:

```http
GET /
```

Response:

```json
{
  "status": "ok",
  "service": "ProLign RAG Chatbot Backend"
}
```

Chat:

```http
POST /chat
```

Request:

```json
{
  "session_id": "test-session",
  "message": "How do I book a mentor session?"
}
```

Response:

```json
{
  "reply": "...",
  "intent": "FAQ"
}
```

Complaint response:

```json
{
  "reply": "I'm sorry to hear you're experiencing an issue. Your complaint has been escalated to our support team and a team member will follow up with you shortly.",
  "intent": "COMPLAINT"
}
```

## Environment Variables

Create a `.env` file inside `prolign-chatbot/`.

Required:

```env
GROQ_API_KEY=
JINA_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SLACK_WEBHOOK_URL=
```

Optional defaults:

```env
GROQ_MODEL=llama-3.3-70b-versatile
JINA_MODEL=jina-embeddings-v2-base-en
FAQ_MATCH_THRESHOLD=0.7
FAQ_MATCH_COUNT=3
MEMORY_LIMIT=6
FRONTEND_ORIGIN=http://localhost:5173
```

React/Vite needs:

```env
VITE_CHATBOT_API_URL=http://localhost:8000/chat
```

Do not put backend secrets in frontend code. Never expose `GROQ_API_KEY`, `JINA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SLACK_WEBHOOK_URL` through Vite variables.

## Supabase Tables

Conversation memory table:

```sql
create table conversation_history (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamp with time zone default now()
);
```

FAQ table:

```sql
create table faqs (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(768) not null,
  category text,
  topic text,
  source text,
  chunk_number int,
  created_at timestamp with time zone default now()
);
```

Important migration note: the n8n workflow used `conversations` and `content` for memory. This backend intentionally uses `conversation_history` and `message`, as required. If the existing Supabase database still uses the old table or field names, migrate the database or update the code/table names before production deployment.

## Supabase RPC Function

Create this function in Supabase:

```sql
CREATE OR REPLACE FUNCTION match_faqs(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id uuid,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    faqs.id,
    faqs.content,
    faqs.category,
    1 - (faqs.embedding <=> query_embedding) AS similarity
  FROM faqs
  WHERE 1 - (faqs.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

The backend calls:

```text
POST {SUPABASE_URL}/rest/v1/rpc/match_faqs
```

With:

```json
{
  "query_embedding": [0.1, 0.2],
  "match_threshold": 0.7,
  "match_count": 3
}
```

## FAQ Flow

1. React sends `{ "session_id": "...", "message": "..." }` to `POST /chat`.
2. The backend saves the user message in Supabase.
3. Groq classifies the message as `FAQ` or `COMPLAINT`.
4. If it is `FAQ`, Jina creates an embedding for the user message.
5. Supabase `match_faqs` returns the top matching FAQ chunks.
6. The backend builds a prompt with FAQ context and recent conversation history.
7. Groq generates the final answer.
8. The backend saves the assistant reply.
9. React receives `data.reply`.

If no FAQ context is found, the backend returns:

```text
I don't have information on that yet, but you can reach our support team.
```

## Complaint Flow

1. React sends the user message to `POST /chat`.
2. The backend saves the user message.
3. Groq classifies the message as `COMPLAINT`.
4. The backend posts a formatted complaint alert to Slack.
5. The backend saves the acknowledgement reply.
6. React receives the acknowledgement in `data.reply`.

## Conversation Memory

Memory is stored in Supabase, not in the browser and not in FastAPI process memory. This allows the chatbot to keep context across requests.

The backend loads the latest messages using:

```text
session_id=eq.{session_id}
order=created_at.desc
limit={MEMORY_LIMIT}
```

Supabase returns newest messages first, so the backend reverses them before putting them into the RAG prompt. This gives Groq a chronological conversation history.

## React Changes

The React component keeps the existing UI, quick replies, messages, typing state, and drawer behavior.

Only the API integration changed:

Old:

```js
fetch(import.meta.env.VITE_N8N_WEBHOOK, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: query })
});
```

New:

```js
fetch(import.meta.env.VITE_CHATBOT_API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    session_id: getSessionId(),
    message: query
  })
});
```

Old response reading:

```js
data.output || data.text || data.message
```

New response reading:

```js
data.reply
```

The new helper chooses a session id in this order:

1. `user._id`
2. `user.id`
3. Existing `localStorage` value
4. New `crypto.randomUUID()` value saved to `localStorage`

## Run Locally

From inside `prolign-chatbot/`:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload
```

On macOS/Linux:

```bash
source venv/bin/activate
```

Health check:

```bash
curl http://localhost:8000/
```

FAQ test:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"test-session\",\"message\":\"How do I book a mentor session?\"}"
```

Complaint test:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"test-session\",\"message\":\"My payment failed and nobody is helping me\"}"
```

## Challenges And How They Were Handled

The first challenge was translating a visual n8n workflow into regular backend code. n8n hides a lot of behavior inside nodes, so the workflow had to be read carefully to identify the actual runtime sequence: webhook, memory load, intent classification, memory write, FAQ or complaint routing, embedding, vector search, Groq answer generation, Slack escalation, and final response.

The second challenge was the database naming mismatch. The n8n workflow used a `conversations` table with a `content` field, but the required final backend must use `conversation_history` with a `message` field. The backend follows the required final schema, and this README calls out the needed database migration.

The third challenge was secret handling. The n8n export included a hardcoded Jina API key. That key was not copied into the new code. The backend uses environment variables instead, and the exposed Jina key should be rotated.

The fourth challenge was preserving the React UI while changing only the integration logic. The component was kept visually the same. The fetch URL, request body, response parsing, session id handling, and error handling were updated.

The fifth challenge was local validation. The code was syntax-checked successfully with the available bundled Python runtime. A full FastAPI import/start test could not be completed in this workspace because FastAPI is not installed in the bundled runtime. After running `pip install -r requirements.txt`, the app can be started with `uvicorn main:app --reload`.

## Requirement Fulfillment Checklist

FastAPI backend created: fulfilled.

`POST /chat` endpoint created: fulfilled.

`GET /` health check created: fulfilled.

Groq intent classification through async REST call: fulfilled.

Groq final FAQ answer generation through async REST call: fulfilled.

Jina embeddings through async REST call: fulfilled.

Supabase vector search through `match_faqs` RPC: fulfilled.

Supabase conversation memory load/save: fulfilled.

Slack complaint escalation through incoming webhook: fulfilled.

All external calls use `httpx.AsyncClient`: fulfilled.

No LangChain dependency: fulfilled.

No OpenAI SDK dependency: fulfilled.

No synchronous `requests` dependency: fulfilled.

Secrets moved to environment variables: fulfilled.

`.env.example` created: fulfilled.

Pinned `requirements.txt` created: fulfilled.

React now uses `VITE_CHATBOT_API_URL`: fulfilled.

React sends `session_id` and `message`: fulfilled.

React reads `data.reply`: fulfilled.

React fallback error message added: fulfilled.

Existing `env.js` preserved: fulfilled.

README setup, architecture, schemas, RPC, flows, testing, and security notes: fulfilled.

Runtime verification against live Groq, Jina, Supabase, and Slack services: pending credentials and network access. The code paths are implemented, but real end-to-end service testing requires valid `.env` values and installed dependencies.

## Security Notes

The n8n export contained a hardcoded Jina API key. Treat it as exposed and rotate or regenerate it before production use.

Also review any credentials stored inside n8n credential records, especially Groq, Supabase, and Slack credentials. Even if they were referenced indirectly by credential names, they should be checked before the old workflow is shared, deleted, or archived.

No API keys are hardcoded in the new backend or React component.

## Deployment Notes

Before production deployment:

1. Install dependencies from `requirements.txt`.
2. Create the backend `.env` file.
3. Create or migrate the Supabase tables.
4. Create the `match_faqs` RPC function.
5. Rotate the exposed Jina key from the n8n export.
6. Set `FRONTEND_ORIGIN` to the deployed frontend URL.
7. Set `VITE_CHATBOT_API_URL` to the deployed FastAPI `/chat` URL.
8. Run a real FAQ request and a real complaint request.

