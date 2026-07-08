# ProLign — REST API Reference (Postman)

Base URL: `http://localhost:5000/api`

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

| Method | Path | Body |
|---|---|---|
| PATCH | `/user/profile` | any of: `name, country, city, title, company, industry, bio, linkedinUrl, profilePic, skills[], languages[], certifications[], hourlyRate, experience, preferredCategories[], availableSlots[], weeklySchedule, education, careerGoals, skillsToLearn[], learningInterests[], profileVisibility, emailSessionRequests, emailReminders, emailMarketing, appearanceTheme` |
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

# Core-entity CRUD  (new — Postman-testable)

All are 🔒 (Bearer token). Every collection supports the same 5 operations:

```
GET    /api/<entity>            list   (?page=&limit=&sort=&<field>=<value> filters)
GET    /api/<entity>/:id        read one
POST   /api/<entity>            create
PATCH  /api/<entity>/:id        update (partial)
DELETE /api/<entity>/:id        delete
```

List envelope: `{ success, count, total, page, pages, data: [...] }`.
Non-admins are auto-scoped to resources they own; **admin sees everything**.
`?field=value` filters work on any schema field (e.g. `?status=confirmed`).

### 6. Availability slots  `/api/availability`
- Reads: any logged-in user (browse a mentor's slots via `?mentorId=<id>`).
- Writes: **mentor / admin**; `mentorId` auto-set from your token.
- Create body: `{ "date": "2026-08-01", "startTime": "10:00", "endTime": "10:30", "slotType": "one_off", "timezone": "Asia/Karachi" }`  *(date, startTime, endTime required)*

### 7. Sessions  `/api/sessions`   (mentor⇄mentee booking)
- Scoped to `menteeId` **or** `mentorId`. Create as the mentee (menteeId auto-set).
- Create body: `{ "mentorId": "<userId>", "slotId": "<slotId>", "sessionType": "mock_interview", "scheduledDate": "2026-08-01T10:00:00Z", "durationMinutes": 60, "priceCharged": 2000, "currency": "PKR" }`  *(mentorId, slotId, sessionType, scheduledDate, priceCharged required)*
- Typical update: `PATCH /:id { "status": "confirmed" }` (enum: pending, confirmed, in_progress, completed, cancelled_by_mentee, cancelled_by_mentor, no_show_mentee, no_show_mentor).

### 8. Payments  `/api/payments`
- Scoped to `menteeId`/`mentorId`.
- Create body: `{ "sessionId": "<id>", "menteeId": "<id>", "mentorId": "<id>", "stripePaymentIntentId": "pi_test_123", "grossAmount": 2000, "platformCommission": 300, "mentorEarnings": 1700, "commissionRate": 0.15, "currency": "pkr" }`  *(these are required)*
- Update: `PATCH /:id { "chargeStatus": "captured", "payoutStatus": "paid" }`.

### 9. Reviews  `/api/reviews`
- Reads: open (browse a mentor's reviews via `?mentorId=<id>`). Author (`menteeId`) auto-set on create.
- Create body: `{ "sessionId": "<id>", "mentorId": "<id>", "rating": 5, "reviewText": "Great session", "subRatings": { "communication": 5, "helpfulness": 4 } }`  *(sessionId, mentorId, rating 1–5 required)*
- One review per session (unique) → duplicate returns `409`. A successful create bumps the mentor's `averageRating`/`ratingBreakdown` (model hook).

### 10. Notifications  `/api/notifications`
- Owner-scoped; recipient `userId` auto-set on create.
- Create body: `{ "type": "session_booked", "title": "Session booked", "body": "Your session is confirmed." }`  *(type, title, body required)*
- Mark read: `PATCH /:id { "isRead": true }`.

### 11. Chat messages  `/api/chat`
- Owner-scoped; `userId` auto-set. List a thread via `?conversationId=<uuid>`.
- Create body: `{ "conversationId": "conv-1", "role": "user", "content": "Hello" }`  *(conversationId, role[user|assistant], content required)*

### 12. Mentor profiles  `/api/mentor-profiles`
- Reads: open (for matching). Writes: **mentor / admin**; `userId` auto-set; one per user (`409` on duplicate).
- Create body: `{ "pricePerSession": 2000, "skills": ["Java","AWS"], "domains": ["Backend"], "industries": ["Finance"], "domainTag": "fintech", "softSkills": ["Leadership"] }`  *(pricePerSession required)*
- The `cleaned.*` object is written by the Python EDA job, but you can PATCH it too for testing.

### 13. Mentee profiles  `/api/mentee-profiles`
- Owner-scoped/private. Writes: **mentee / admin**; `userId` auto-set; one per user (`409` on duplicate).
- Create body: `{ "university": "Georgia Tech", "degree": "MBA (Tech)", "domainInterest": "martech", "softSkills": ["Communication"], "onboardingAnswers": { "targetRole": "Staff Engineer", "targetCompanyTier": "Mid-market tech" } }`
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
