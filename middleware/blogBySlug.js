const Blog = require("../models/blog");

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
