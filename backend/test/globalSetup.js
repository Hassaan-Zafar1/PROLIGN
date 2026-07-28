import { MongoMemoryServer } from "mongodb-memory-server";

// Runs once for the whole Vitest run, in a separate process from the actual
// test files — but process.env mutations made here ARE visible to test
// files (this is Vitest's documented mechanism for passing config down).
// Setting MONGO_URI and NODE_ENV *before* any test file ever imports
// config/env.js means dotenv.config() (which never overwrites an
// already-set var) leaves these two alone and only fills in the real
// .env's other values (JWT secrets, email creds, etc.) — so the suite never
// touches the real Atlas cluster, but still gets real secrets for anything
// that needs them (e.g. signing JWTs the same way production does).
let mongod;

export async function setup() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.NODE_ENV = "test";
}

export async function teardown() {
  await mongod?.stop();
}
