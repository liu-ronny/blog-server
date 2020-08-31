/**
 * @fileoverview The test file for the login router.
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

describe("when there are initial users saved", () => {
  test("requests with valid credentials succeed with status code 200", async () => {
    jest.setTimeout(30000);

    const users = helper.users();

    for (let user of users) {
      const response = await api
        .post("/api/login")
        .send({ username: user.username, password: user.password })
        .expect(200);

      const cookie = helper.parseCookie(response.header["set-cookie"][0]);

      expect(cookie["connect.sid"]).toBeDefined();
      expect(cookie.Path).toBe("/");
      expect(cookie.Expires).toBeDefined();
      expect(cookie.HttpOnly).toBeDefined();

      // const returnedUser = response.body;
      // expect(returnedUser.username).toBe(user.username);
      // expect(returnedUser.name).toBe(user.username);
      // expect(returnedUser.id).toBeDefined();
      // expect(returnedUser.blogs).toBeDefined();
      // expect(returnedUser.passwordHash).not.toBeDefined();
      // expect(Object.keys(returnedUser)).toHaveLength(4);
    }
  });

  test("requests without valid credentials fail with status code 401", async () => {
    await api
      .post("/api/login")
      .send({ username: "invalid", password: "superinvalid" })
      .expect(401);
  });

  test("requests missing the username or password property fail with status code 400", async () => {
    await api.post("/api/login").send({ username: "admin" }).expect(400);
    await api.post("/api/login").send({ password: "hunter1" }).expect(400);
    await api.post("/api/login").expect(400);
  });
});
