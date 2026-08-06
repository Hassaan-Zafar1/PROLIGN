# syntax=docker/dockerfile:1.7
# ProLign Express API. Build context is backend/.
#
# bookworm-slim rather than alpine on purpose: pdfjs-dist/@napi-rs/canvas ship
# prebuilt native binaries whose musl variants are unreliable, and glibc costs
# only ~30 MB here.
#
# Node 22, not 20: pdfjs-dist@6 declares engines node ">=22.13.0 || >=24", and
# services/pdfTextService.js:1 imports it with a top-level static import, so it
# loads on every boot rather than lazily. Node 20 installs with an EBADENGINE
# warning and can then fail at runtime. .github/workflows/ci.yml is pinned to
# Node 22 too, to match.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Requires backend/package-lock.json to be committed (backend/.gitignore no
# longer excludes it).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app

RUN useradd --create-home --uid 10001 app

COPY --from=deps --chown=app:app /app/node_modules ./node_modules
COPY --chown=app:app . .

# express.static serves /uploads/cvs from here (server.js:122) and
# cvController.js mkdirs it on first upload. Ephemeral in ECS by design.
RUN mkdir -p uploads/cvs && chown -R app:app uploads

USER app
EXPOSE 5000

# Node-native healthcheck — no curl binary/apt layer needed just for this.
# Liveness only: /api/health is registered before the routers and does not ping
# Mongo (server.js:76), so it answers 200 even with the DB down. Initial connect
# failure exits the process anyway (config/database.js:5-30), which ECS restarts.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:5000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Must stay `node server.js` with WORKDIR /app: server.js:167-171 only calls
# startServer() when process.argv[1] resolves to the module's own path. Any
# wrapper that changes argv[1] starts nothing and exits 0 with no listener.
CMD ["node", "server.js"]
