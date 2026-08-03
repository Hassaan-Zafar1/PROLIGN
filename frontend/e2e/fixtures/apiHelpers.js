// Direct backend API calls for E2E test SETUP/teardown — use the UI for what's
// actually under test, but seed prerequisite state (accounts, availability
// slots, mentee profiles) via the API so specs stay fast and focused on the
// journey being verified, not on re-deriving state every other spec needs too.
const API_BASE = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api';

async function json(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(`API ${res.status}: ${data.message || JSON.stringify(data)}`);
  return data;
}

export async function apiRegister({ email, password, role, name, linkedinUrl, hourlyRate }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password, role, name,
      ...(linkedinUrl && { linkedinUrl }),
      ...(hourlyRate != null && { hourlyRate }),
    }),
  });
  return json(res);
}

// Dev/test-only — see backend/routes/testHelpers.js. 404s in production.
export async function apiGetLastOtp(userId) {
  const res = await fetch(`${API_BASE}/test/last-otp/${userId}`);
  const data = await json(res);
  return data.otp;
}

export async function apiVerifyOtp(userId, otp) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, otp }),
  });
  return json(res); // { accessToken, user }
}

export async function apiLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return json(res);
}

// Register + retrieve the OTP via the dev-only side channel + verify, in one
// call — the common case for "I just need a logged-in account of this role".
export async function registerAndVerify({ email, password, role, name, ...rest }) {
  const reg = await apiRegister({ email, password, role, name, ...rest });
  const otp = await apiGetLastOtp(reg.userId);
  return apiVerifyOtp(reg.userId, otp); // { accessToken, user }
}

export async function apiCreateAvailabilitySlot(token, { date, startTime, endTime }) {
  const res = await fetch(`${API_BASE}/availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ date, startTime, endTime, slotType: 'one_off', timezone: 'Asia/Karachi' }),
  });
  return json(res);
}

// Dev/test-only. Mimics an unlinked Mentee_Profiles doc as Python would write
// it, so the real POST /api/interview link step (below) can be exercised
// without driving a live, non-deterministic LLM conversation.
export async function apiSeedMenteeProfile(fields = {}) {
  const res = await fetch(`${API_BASE}/test/seed-mentee-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await json(res);
  return data.sessionId;
}

export async function apiLinkInterview(token, sessionId) {
  const res = await fetch(`${API_BASE}/interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ sessionId }),
  });
  return json(res);
}

export async function pingHealth(baseUrl, path = '') {
  try {
    const res = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
