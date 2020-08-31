/**
 * @fileoverview The test file for the logout router.
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
  test("logged in users are successfully logged out", async () => {
    jest.setTimeout(30000);

    const users = helper.users();

    for (let user of users) {
      const sessionId = await helper.login(api, user.username, user.password);
      let isLoggedIn = await helper.checkSession(api, sessionId);
      expect(isLoggedIn).toBe(true);

      await helper.logout(api, sessionId);
      isLoggedIn = await helper.checkSession(api, sessionId);
      expect(isLoggedIn).toBe(false);
    }
  });

  test("non logged in users are successfully logged out", async () => {
    // send a request to log out without sending a session id
    await helper.logout(api);
    let isLoggedIn = await helper.checkSession(api);
    expect(isLoggedIn).toBe(false);

    // send a request to log out with an invalid session id
    await helper.logout(api, "invalid");
    isLoggedIn = await helper.checkSession(api, "invalid");
    expect(isLoggedIn).toBe(false);
  });
});
