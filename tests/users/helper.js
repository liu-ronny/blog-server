const User = require("../../models/user");
const {
  initialUsers,
  initialUsersWithHashedPasswords,
} = require("./fakeUsers");

const insertInitialUsers = async () => {
  await User.create(initialUsersWithHashedPasswords);
};

const users = () => {
  return initialUsers.map((user) => {
    return { ...user };
  });
};

const usersWithHashedPasswords = () => {
  return initialUsersWithHashedPasswords.map((user) => {
    return { ...user };
  });
};

const nonExistentId = async () => {
  const user = { username: "willsoon", passwordHash: "notexist" };
  const newUser = await User.create(user);

  const id = newUser._id;

  await User.findByIdAndDelete(id);

  return id;
};

const admin = () => {
  return { ...initialUsers[0] };
};

const adminInDb = async () => {
  return await User.findOne({ username: "admin" });
};

const usersInDb = async () => {
  return await User.find({});
};

const deleteAll = async () => {
  await User.deleteMany({});
};

const parseCookie = (cookie) => {
  const parsedCookie = {};
  cookie = cookie.split(";").map((prop) => prop.split("="));

  for (let [key, val] of cookie) {
    key = key.trim();
    val = val ? val.trim() : true;

    parsedCookie[key] = val;
  }

  return parsedCookie;
};

const login = async (api, username, password) => {
  const response = await api
    .post("/api/login")
    .send({ username, password })
    .expect(200);

  const sessionId = parseCookie(response.header["set-cookie"][0])[
    "connect.sid"
  ];

  return sessionId;
};

module.exports = {
  insertInitialUsers,
  admin,
  users,
  usersWithHashedPasswords,
  adminInDb,
  usersInDb,
  deleteAll,
  parseCookie,
  login,
  nonExistentId,
};
