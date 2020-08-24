const loginRouter = require("express").Router();
const passport = require("passport");

/**
 * Login route for users. Passport is used to handle authentication.
 * If authentication is successful, the deserialized user will be loaded onto
 * req.user. If authentication is unsuccessful, Passport will respond with a
 * 401 status code.
 * @name post/
 * @function
 * @memberof loginRouter
 * @param {string} path - Express path
 * @param {Function} authenticate - Passport middleware that authenticates logins
 * @param {Function} middleware - Express middleware
 */
loginRouter.post("/", passport.authenticate("local"), async (req, res) => {
  res.status(200).end();
});

loginRouter.use((err, req, res, next) => {
  return res.status(500).json({
    error: "an error occurred on the server - please check logs to debug",
  });
});

module.exports = loginRouter;
