const sessionsRouter = require("express").Router();

/**
 * Checks whether a user has a valid session.
 * @name get/
 * @function
 * @memberof sessionsRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 */
sessionsRouter.get("/", async (req, res) => {
  if (req.user) {
    return res.json({ authenticated: true });
  }

  res.json({ authenticated: false });
});

sessionsRouter.use((err, req, res, next) => {
  return res.status(500).json({
    error: "an error occurred on the server - please check logs to debug",
  });
});

module.exports = sessionsRouter;
