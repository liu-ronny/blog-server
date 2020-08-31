const logoutRouter = require("express").Router();

/**
 * Logout route for users. Passport is used to handle the process, which will
 * terimate a login session if one exists.
 * @name get/
 * @function
 * @memberof logoutRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 */
logoutRouter.get("/", async (req, res) => {
  req.logout();
  res.status(200).end();
});

logoutRouter.use((err, req, res, next) => {
  return res.status(500).json({
    error: "an error occurred on the server - please check logs to debug",
  });
});

module.exports = logoutRouter;
