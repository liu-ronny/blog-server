const Blog = require("../models/blog");

/**
 * Middleware that returns the blogs corresponding to the requested tag. If a
 * 'tag' parameter is not provided in the request query string, then control
 * is passed to the next middleware.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const tags = async (req, res, next) => {
  let tag = req.query.tag;

  if (tag) {
    const blogs = await Blog.find({ hidden: false, tags: tag });
    return res.json(blogs);
  }

  next();
};

module.exports = tags;
