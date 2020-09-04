/**
 * @fileoverview The logout router for the the API. The express-async-errors
 * library is used to avoid too many try/catch blocks when performing error
 * handling. Any errors that occur in the route handlers are forwarded to the
 * error handler middleware.
 */

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

/**
 * Handles errors for the logout router.
 * @name error
 * @function
 * @memberof logoutRouter
 * @param {Function} middleware - Express middleware
 */
logoutRouter.use((err, req, res, next) => {
  return res.status(500).json({
    error: "an error occurred on the server - please check logs to debug",
  });
});

module.exports = logoutRouter;
