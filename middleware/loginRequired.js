/**
 * Middleware that enforces a login restriction on the request. It checks whether
 * req.user exists. If it doesn't, then Passport was unable to populate a user
 * object, meaning the request did not come from a logged in user.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const loginRequired = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "you must be logged in to access this route" });
  }

  next();
};

module.exports = loginRequired;
