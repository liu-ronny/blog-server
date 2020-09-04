/**
 * Middleware that checks whether the user corresponding to the request is
 * the admin user. If not, a 401 status resposne is returned to the client.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const adminRequired = (req, res, next) => {
  if (!req.user || req.user.username !== "admin") {
    return res.status(401).json({
      error: "you must be logged in as the admin to access this route",
    });
  }

  next();
};

module.exports = adminRequired;
