# ProLign — REST API Reference (Postman)

Base URL: `http://localhost:5000/api`

> **Data ownership (refactor):** `User` holds only auth + shared identity +
> account state. All mentor domain data lives on **MentorProfile**, all mentee
> domain data on **MenteeProfile** (1:1 via `userId`). `GET /auth/me`, login and
> verify return the user with `mentorProfile` / `menteeProfile` **populated**.
> `GET /mentors*` returns a flat merged view (User identity + MentorProfile
> fields; `id` = the User `_id`). Mentors & mentees are **auto-approved** — no
> admin approval gate.

## Auth model — how to authenticate in Postman

1. **Register** or **Login** → the response returns an `accessToken` (JWT).
   - Register returns `userId` (no token yet — you must verify OTP first).
   - Verify OTP / Login returns `{ accessToken, user }`.
2. For every **protected** endpoint, send the token as a header:
   ```
   Authorization: Bearer <accessToken>
   ```
   In Postman: **Authorization** tab → Type **Bearer Token** → paste the token.
   (Refresh token is set as an httpOnly cookie; `POST /auth/refresh` uses it.)
3. Tip: save the token to a Postman **environment variable** `{{token}}` and set
   the collection Authorization to `Bearer {{token}}` so every request inherits it.
4. **Roles**: some routes require a role (`mentor` / `mentee` / `admin`). Log in
   with an account of that role. Admins bypass ownership checks everywhere.

Common responses: `200` ok, `201` created, `400` validation/bad id, `401`
no/invalid token, `403` wrong role or not your resource, `404` not found,
`409` duplicate.

---

## 1. Authentication  `/api/auth`   (public unless noted)

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password, role, name, linkedinUrl?, hourlyRate?, cv? }` | role = `mentor`\|`mentee`. Returns `userId`, sends OTP (printed to server console in dev). |
| POST | `/auth/verify-otp` | `{ userId, otp }` | Returns `{ accessToken, user }`. |
| POST | `/auth/resend-otp` | `{ userId }` | |
| POST | `/auth/login` | `{ email, password }` | Returns `{ accessToken, user }`; if unverified returns `userId`. |
| POST | `/auth/refresh` | — | Uses refresh cookie → new `accessToken`. |
| POST | `/auth/logout` | — | |
| POST | `/auth/forgot-password` | `{ email }` | Emails a reset link. |
| POST | `/auth/reset-password` | `{ token, password }` | |
| GET | `/auth/me` | — | 🔒 current user. |
| GET | `/auth/google` | — | Browser only (OAuth redirect). |
| GET | `/auth/google/callback` | — | Browser only (Google redirects here). |

## 2. User profile  `/api/user`   🔒

`PATCH /user/profile` now only accepts **shared/account** fields. Role-specific
fields are updated via `/api/mentor-profiles/:id` or `/api/mentee-profiles/:id`.

| Method | Path | Body |
|---|---|---|
| PATCH | `/user/profile` | any of: `name, country, city, profilePic, profileVisibility, emailSessionRequests, emailReminders, emailMarketing, appearanceTheme` |
| POST | `/user/change-password` | `{ currentPassword, newPassword }` |
| DELETE | `/user/account` | — |

## 3. Mentors (directory)  `/api/mentors`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/mentors` | public | `?search=&skills=a,b&minExperience=&sort=newest|experience|priceLow|priceHigh&page=&limit=` |
| GET | `/mentors/recommended` | public | `?limit=` — recommendation seam (all mentors for now). |
| GET | `/mentors/:id` | public | single public mentor. |
| POST | `/mentors/profile/build` | 🔒 mentor | builds structured profile from the mentor's uploaded CV. |

## 4. Mentee interview  `/api/interview`   🔒 mentee

| Method | Path | Body |
|---|---|---|
| GET | `/interview` | — (returns this mentee's assessment or null) |
| POST | `/interview` | `{ answers: [{ id, question, answer }], mode?: "text" }` |

## 5. Admin  `/api/admin`   🔒 admin

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/users` | `?role=mentor|mentee` optional. |
| POST | `/admin/mentors/:id/approve` | |
| POST | `/admin/mentors/:id/reject` | `{ reason? }` |
| DELETE | `/admin/users/:id` | |

---

# Core-entity CRUD  (Postman-testable)

All are 🔒 (Bearer token). **Each collection now has its own dedicated service
with real domain logic** (validation, side-effects, population, state machines) —
they are no longer a shared generic handler. The base shape is still:

```
GET    /api/<entity>            list   (envelope below + per-entity filters)
GET    /api/<entity>/:id        read one
POST   /api/<entity>            create
PATCH  /api/<entity>/:id        update (partial)
DELETE /api/<entity>/:id        delete
```

List envelope: `{ success, count, total, page, pages, data: [...] }`.
Non-admins are auto-scoped to resources they own/participate in; **admin sees
everything**. The specific filters, guards, and side-effects per entity follow.

### 6. Availability slots  `/api/availability`
- **Reads:** any logged-in user — browse a mentor's slots via `?mentorId=<id>` (also `?status=available&date=2026-08-01`).
- **Writes:** `mentor` / `admin`; `mentorId` auto-set from your token; owner-or-admin to edit/delete.
- **Create body:** `{ "date": "2026-08-01", "startTime": "10:00", "endTime": "10:30", "slotType": "one_off", "timezone": "Asia/Karachi" }`  *(date, startTime, endTime required)*
- **Rules:** no past dates; `endTime` must be after `startTime`; overlapping slots → `409`; a slot whose `status` is `booked` **cannot** be edited or deleted.

### 7. Sessions  `/api/sessions`   (mentor⇄mentee booking + state machine)
- **List filters:** `?as=mentor|mentee` (default: both roles you're in), `?status=confirmed`, `?when=upcoming|past`. Mentee/mentor/slot are **populated**.
- **Create** as the mentee (`menteeId` auto-set): `{ "mentorId": "<userId>", "slotId": "<slotId>", "sessionType": "mock_interview", "durationMinutes": 60 }`  *(mentorId, slotId, sessionType required)*
  - Validates `mentorId ≠ menteeId`; slot must exist, belong to that mentor, and be `available`; **price is snapshotted** from the MentorProfile (you don't send it); the slot is **atomically claimed** (`available → booked`) and rolled back on any error.
- **Transitions** via `PATCH /:id { "status": "..." }` — enforced by role:
  - mentor: `confirm` → `in_progress` → `completed`, or `no_show_mentee`.
  - either party: `cancel` (→ `cancelled_by_mentor|mentee`) which **frees the slot** back to `available`.
- **Delete** frees the slot.

### 8. Payments  `/api/payments`
- **Scoped** to `menteeId`/`mentorId` (participants) — admin sees all.
- **Create** (`mentee`/`admin`): `{ "sessionId": "<id>", "grossAmount": 2000, "currency": "pkr" }`  *(sessionId, grossAmount required)*
  - `platformCommission`, `mentorEarnings` are **derived** server-side (default commission 15%); a test `pi_test_...` id is auto-generated; the payment is linked back onto `session.paymentId`. Duplicate per session → `409`.
- **Update/Delete:** **admin only** — drives `chargeStatus` / `payoutStatus` / `refund` transitions.

### 9. Reviews  `/api/reviews`
- **List:** `?mentorId=<id>` (public — visible & non-flagged only), `?mine=true` (your own), admin sees all.
- **Create** (`mentee`, author auto-set): `{ "sessionId": "<id>", "rating": 5, "reviewText": "Great session", "subRatings": { "communication": 5, "helpfulness": 4 } }`  *(sessionId, rating 1–5 required)*
  - The session must be **completed** and yours; one review per session → `409`; links onto `session.reviewId`; a post-save hook recomputes the mentor's rating. `mentorId` is taken from the session.
- **Update:** author edits `rating`/`reviewText`; the **reviewed mentor** may add `mentorReply`; **admin** moderates `isVisible`/`flagged`/`flagReason`. Anonymous reviews hide `menteeId` in responses.

### 10. Notifications  `/api/notifications`
- **List:** own only; `?unread=true`, `?type=...`; response includes an **`unreadCount`**.
- **Create:** `{ "type": "session_booked", "title": "Session booked", "body": "..." }`  *(type, title, body required)* — targets you (admins may set `userId` to target another user).
- **`PATCH /notifications/read-all`** → marks **all** your unread as read (returns `modified` count).
- Mark one: `PATCH /:id { "isRead": true }` (sets/clears `readAt`).

### 11. Chat messages  `/api/chat`
- **Owner-scoped;** `userId` auto-set. `?conversationId=<uuid>` returns that thread **oldest→newest**; no filter returns all your messages newest-first.
- **Create:** `{ "conversationId": "conv-1", "role": "user", "content": "Hello" }`  *(conversationId, role[user|assistant], content required)*
- `PATCH /:id { "content" }` edits your message; delete is own-scoped.

### 12. Mentor profiles  `/api/mentor-profiles`
- **List:** approved profiles (admin sees all), with `userId` populated (name/pic/country/city).
- **`GET /mentor-profiles/me`** / **`PATCH /mentor-profiles/me`** — your own profile without needing its id.
- **`GET /mentor-profiles/:id`** — public if `approved`, else owner/admin only.
- **Writes:** `mentor`/`admin`; one per user (`409` on duplicate). Owner may edit domain fields (skills, domains, pricing, availability, etc.); **only admin** may change `status`/`isApproved`/`rejectionReason`. Ratings & the `cleaned.*` matching fields are **not** owner-editable.
- **Create/update body:** `{ "pricePerSession": 2000, "skills": ["Java","AWS"], "domains": ["Backend"], "industries": ["Finance"], "domainTag": "fintech", "softSkills": ["Leadership"] }`
- **Delete:** admin only.

### 13. Mentee profiles  `/api/mentee-profiles`
- **Private.** `GET /mentee-profiles` is **admin-only**; regular users use the `/me` endpoints.
- **`GET /mentee-profiles/me`** / **`PATCH /mentee-profiles/me`** — your own profile.
- **`GET /mentee-profiles/:id`** — owner or admin only.
- **Writes:** `mentee`/`admin`; one per user (`409`). Owner edits basics/goals/interview answers; AI fields (`skillProfile`, `matchHistory`, `cleaned.*`) are **not** owner-editable. Delete is admin only.
- **Create/update body:** `{ "university": "Georgia Tech", "degree": "MBA (Tech)", "domainInterest": "martech", "softSkills": ["Communication"], "onboardingAnswers": { "targetRole": "Staff Engineer", "targetCompanyTier": "Mid-market tech" } }`
- Note: completing `POST /api/interview` already creates/updates this profile automatically.

---

## Quick smoke test (copy-paste order)

1. `POST /api/auth/register` → `{email,password,role:"mentee",name}` → copy `userId`; read OTP from server console.
2. `POST /api/auth/verify-otp` → `{userId, otp}` → copy `accessToken`.
3. Set Postman Bearer token = that `accessToken`.
4. `GET /api/auth/me` → 200, your user.
5. `POST /api/interview` with sample answers → creates your MenteeProfile.
6. `GET /api/mentee-profiles` → see your profile.
7. Register/login a **mentor**, `POST /api/availability`, then as the mentee `POST /api/sessions` referencing that slot; `POST /api/reviews`; etc.
