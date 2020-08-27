/**
 * @fileoverview The test file for the users router.
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

const createUser = async (sessionId, username, password, statusCode) => {
  const response = api.post("/api/users");

  if (sessionId) response.set("Cookie", `connect.sid=${sessionId}`);
  if (username) response.send({ username });
  if (password) response.send({ password });
  response.expect(statusCode);

  return (await response).body;
};

const checkUserCount = async (newUser, shouldIncrease) => {
  const usersInDb = await helper.usersInDb();
  const initialLength = helper.users().length;

  if (shouldIncrease) {
    expect(usersInDb).toContainEqual(expect.objectContaining(newUser));
    expect(usersInDb).toHaveLength(initialLength + 1);
  } else {
    if (newUser) {
      expect(usersInDb).not.toContainEqual(expect.objectContaining(newUser));
    }
    expect(usersInDb).toHaveLength(initialLength);
  }
};

describe("when there is an admin user saved", () => {
  test("admin user requests to create a new user succeed with status code 201", async () => {
    const admin = helper.admin();
    const user = { username: "freshuser", password: "12345" };

    const sessionId = await login(api, admin.username, admin.password);
    const newUser = await createUser(
      sessionId,
      user.username,
      user.password,
      201
    );

    delete user.password;
    expect(newUser).toEqual(expect.objectContaining(user));
    expect(newUser.name).toBe(user.username);

    await checkUserCount(user, true);
  });

  test("admin requests to create a new user that are missing the username or password properties fail with status code 400", async () => {
    const admin = helper.admin();
    const user = { username: "freshuser", password: "12345" };

    const sessionId = await login(api, admin.username, admin.password);

    await createUser(sessionId, user.username, null, 400);
    await checkUserCount({ username: user.username }, false);

    await createUser(sessionId, null, user.password, 400);
    await checkUserCount({ username: user.username }, false);

    await createUser(sessionId, null, null, 400);
    await checkUserCount({ username: user.username }, false);
  });

  test("admin requests to create a new user that has a non-unique username fails with status code 400", async () => {
    const admin = helper.admin();
    const user = { username: "admin", password: "12345" };

    const sessionId = await login(api, admin.username, admin.password);
    await createUser(sessionId, user.username, user.password, 400);

    delete user.password;
    await checkUserCount(null, false);
  });

  test("non-admin user requests to create a new user fail with status code 401", async () => {
    const nonAdmin = helper.users()[1];
    const user = { username: "freshuser", password: "12345" };

    const sessionId = await login(api, nonAdmin.username, nonAdmin.password);
    await createUser(sessionId, user.username, user.password, 401);

    delete user.password;
    await checkUserCount(user, false);
  });

  test("guest (i.e. users who are not logged in) requests to create a new user fail with status code 401", async () => {
    const user = { username: "freshuser", password: "12345" };

    await createUser(null, user.username, user.password, 401);

    delete user.password;
    await checkUserCount(user, false);
  });

  test("admin requests to get all users works", async () => {
    const admin = helper.admin();
    const sessionId = await login(api, admin.username, admin.password);

    const response = await api
      .get("/api/users")
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(200);
    const users = response.body;

    const usersInDb = (await helper.usersInDb()).map((user) => user.toJSON());

    expect(users).toEqual(usersInDb);
    expect(users).toHaveLength(usersInDb.length);
  });

  test("non-admin requests to get all users fails with status 401", async () => {
    const user = { username: "testuser", password: "testpassword" };
    const sessionId = await login(api, user.username, user.password);

    // test getting all users with a logged in user who is not the admin
    let response = await api
      .get("/api/users")
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(401);
    let users = response.body;

    const usersInDb = (await helper.usersInDb()).map((user) => user.toJSON());

    expect(users).not.toEqual(usersInDb);

    // test getting all users with a user who is not logged in
    response = await api.get("/api/users").expect(401);
    users = response.body;

    expect(users).not.toEqual(usersInDb);
  });
});
