const adminRequired = (req, res, next) => {
  if (!req.user || req.user.username !== "admin") {
    return res.status(401).json({
      error: "you must be logged in as the admin to access this route",
    });
  }

  next();
};

module.exports = adminRequired;
