/**
 * @fileoverview The login router for the the API. The express-async-errors
 * library is used to avoid too many try/catch blocks when performing error
 * handling. Any errors that occur in the route handlers are forwarded to the
 * error handler middleware.
 */

const loginRouter = require("express").Router();
const passport = require("passport");

/**
 * Login route for users. Passport is used to handle authentication.
 * If authentication is successful, the deserialized user will be loaded onto
 * req.user. If authentication is unsuccessful, Passport will respond with a
 * 401 status code and the request will never hit this route handler.
 * @name post/
 * @function
 * @memberof loginRouter
 * @param {string} path - Express path
 * @param {Function} authenticate - Passport middleware that authenticates logins
 * @param {Function} middleware - Express middleware
 */
loginRouter.post("/", passport.authenticate("local"), (req, res) => {
  // if we get to this point, the user has been authenticated and we simply
  // respond with a 200 OK status
  res.status(200).end();
});

/**
 * Handles errors for the login router.
 * @name error
 * @function
 * @memberof loginRouter
 * @param {Function} middleware - Express middleware
 */
loginRouter.use((err, req, res, next) => {
  return res.status(500).json({
    error: "an error occurred on the server",
  });
});

module.exports = loginRouter;
