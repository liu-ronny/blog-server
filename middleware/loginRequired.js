const loginRequired = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "you must be logged in to access this route" });
  }

  next();
};

module.exports = loginRequired;
