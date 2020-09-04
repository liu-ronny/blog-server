/**
 * @fileoverview The sessions router for the the API. The express-async-errors
 * library is used to avoid too many try/catch blocks when performing error
 * handling. Any errors that occur in the route handlers are forwarded to the
 * error handler middleware.
 */

const sessionsRouter = require("express").Router();

/**
 * Checks whether a user has a valid session.
 * // TODO - this route should probably be moved to the users router
 * @name get/
 * @function
 * @memberof sessionsRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 */
sessionsRouter.get("/", async (req, res) => {
  // if a req.user object exists, then the client sent a valid session ID
  if (req.user) {
    return res.json({ authenticated: true });
  }

  res.json({ authenticated: false });
});

/**
 * Handles errors for the sessions router.
 * @name error
 * @function
 * @memberof sessionsRouter
 * @param {Function} middleware - Express middleware
 */
sessionsRouter.use((err, req, res, next) => {
  return res.status(500).json({
    error: "an error occurred on the server",
  });
});

module.exports = sessionsRouter;
