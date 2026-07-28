// Deterministic test data — no test should depend on data created by another,
// unrelated test. These are fixtures for E2E specs to `.register(...)` fresh
// accounts from (unique email AND name per call — a fixed name across many
// runs makes UI locators that filter/match by visible name text ambiguous
// once more than one run's data has accumulated), not accounts assumed to
// already exist.
function uniqueSuffix() {
  return `${Date.now()}.${Math.floor(Math.random() * 10000)}`;
}

export function uniqueEmail(prefix) {
  return `${prefix}.${uniqueSuffix()}@e2e.test`;
}

export const testUsers = {
  mentee: () => {
    const suffix = uniqueSuffix();
    return {
      name: `E2E Mentee ${suffix}`,
      email: `mentee.${suffix}@e2e.test`,
      password: 'TestPass123!',
    };
  },
  mentor: () => {
    const suffix = uniqueSuffix();
    return {
      name: `E2E Mentor ${suffix}`,
      email: `mentor.${suffix}@e2e.test`,
      password: 'TestPass123!',
      linkedIn: 'https://www.linkedin.com/in/e2e-mentor/',
      hourlyRate: '50',
    };
  },
};
