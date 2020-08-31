const bcrypt = require("bcrypt");
const adminRequired = require("../middleware/adminRequired");
const loginRequired = require("../middleware/loginRequired");
const { checkForCredentials } = require("../utils/utils");
const usersRouter = require("express").Router();
const User = require("../models/user");
const Blog = require("../models/blog");

/**
 * Creates a new user given a username and password. This route is only
 * accessible when logged in as the admin user.
 * @name post/
 * @function
 * @memberof usersRouter
 * @param {string} path - Express path
 * @param {Function} adminRequired - Express middleware that checks whether the user is logged in as the admin
 * @param {Function} middleware - Express middleware
 */
usersRouter.post("/", adminRequired, async (req, res) => {
  const { username, password } = req.body;
  const { credentialsProvided, message } = checkForCredentials(
    username,
    password
  );

  if (!credentialsProvided) {
    return res.status(400).json({ error: message });
  }

  const passwordHash = await bcrypt.hash(password, 14);
  const newUser = await User.create({ username, passwordHash });

  res.status(201).json(newUser);
});

usersRouter.get("/", adminRequired, async (req, res) => {
  const users = await User.find({});

  res.json(users);
});

/**
 * Gets all blogs belonging to a logged in user.
 * @name get/my/blogs
 * @function
 * @memberof usersRouter
 * @param {string} path - Express path
 * @param {Function} loginRequired - Express middleware that checks whether the user is logged in
 * @param {Function} middleware - Express middleware
 */
usersRouter.get("/my/blogs", loginRequired, async (req, res) => {
  const user = req.user;

  let blogs = await Blog.find({ author: user._id }).populate(
    "author",
    "-blogs -username"
  );

  res.json(blogs);
});

usersRouter.use((err, req, res, next) => {
  switch (err.name) {
    case "CastError":
      return res.status(400).json({ error: `invalid request: ${err.message}` });
    case "ValidationError":
      return res
        .status(400)
        .json({ error: `validation failed: ${err.message}` });
    case "MongoError":
      return res.status(400).json({
        error: `Mongo error: ${err.message}`,
      });
    default:
      return res.status(500).json({
        error: "an error occurred on the server - please check logs to debug",
      });
  }
});

module.exports = usersRouter;
