/**
 * @fileoverview The test file for the sessions router.
 */

const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../../app");

const api = supertest(app);
const helper = require("./helper");

beforeEach(async () => {
  await helper.deleteAll();
  await helper.insertInitialUsers();
});

afterEach(async () => {
  await helper.deleteAll();
});

afterAll(async () => {
  await mongoose.connection.db.collection("sessions").deleteMany({});
  mongoose.connection.close();
});

const login = helper.login;

describe("session validation", () => {
  test("returns true when there is a valid session", async () => {
    const admin = helper.admin();
    const sessionId = await login(api, admin.username, admin.password);

    const response = await api
      .get("/api/sessions")
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(200);
    const result = response.body;

    expect(result.authenticated).toBe(true);
  });

  test("returns false when there is an invalid session", async () => {
    let response = await api
      .get("/api/sessions")
      .set("Cookie", `connect.sid=invalidid`)
      .expect(200);
    let result = response.body;

    expect(result.authenticated).toBe(false);

    response = await api.get("/api/sessions").expect(200);
    result = response.body;

    expect(result.authenticated).toBe(false);
  });
});
