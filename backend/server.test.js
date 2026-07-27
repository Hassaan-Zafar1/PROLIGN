import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './server.js';

// Phase 0 harness-verification smoke test — proves Vitest + Supertest can
// drive the real Express app (imported, not listening on a real port) before
// Phase 4 adds the full per-route-file API suite. /api/health touches no
// database, so this needs no test DB setup yet.
describe('server smoke test', () => {
  it('GET /api/health responds 200 with success:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
