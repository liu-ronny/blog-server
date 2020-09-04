const Blog = require("../models/blog");

/**
 * Middleware that populates the request object with a blog property. If a 'slug'
 * parameter is provided in the request query string, the function will attempt
 * to retrieve the blog that correspodns to the slug. If the slug is not found,
 * the response will return the appropriate 4xx status code.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const blogBySlug = async (req, res, next) => {
  const slug = req.params.slug;

  try {
    var blog = await Blog.findOne({ slug, hidden: false }).populate(
      "author",
      "-blogs -username"
    );
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  if (!blog) {
    return res.status(404).json({ error: "the requested blog does not exist" });
  }

  req.blog = blog;

  next();
};

module.exports = blogBySlug;
