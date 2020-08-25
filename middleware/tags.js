const Blog = require("../models/blog");

const tags = async (req, res, next) => {
  let tag = req.query.tag;

  if (tag) {
    const blogs = await Blog.find({ hidden: false, tags: tag });
    return res.json(blogs);
  }

  next();
};

module.exports = tags;
