/**
 * @fileoverview Dummy user data used to seed the test database during testing.
 */

const initialUsers = [
  {
    username: "admin",
    password: "hunter1",
  },
  {
    username: "testuser",
    password: "testpassword",
  },
  {
    username: "hello",
    password: "world",
  },
  {
    username: "user3",
    password: "password",
  },
];

const initialUsersWithHashedPasswords = [
  {
    username: "admin",
    passwordHash:
      "$2b$14$kdKpR15NLdljdMQxEKeghuLTFKktTx8gRhIiVxLJdfjQdUMHxz5eq",
  },
  {
    username: "testuser",
    passwordHash:
      "$2b$14$8cAdaK/gXhwZlz9BmoWbrOK0lNhqUSUcBCTtLIjY1FkKmV4jtB.Za",
  },
  {
    username: "hello",
    passwordHash:
      "$2b$14$owGODIIH1rWipurnYhXLn.Gaz4dnN7mFWl8HbimHg6KMyRdA7FBjq",
  },
  {
    username: "user3",
    passwordHash:
      "$2b$14$h7gbyJ6n3UrIm.K.yACL4uzJ3sgIvJY2KK24nadMkILAuwD26yGTW",
  },
];

module.exports = {
  initialUsers,
  initialUsersWithHashedPasswords,
};
