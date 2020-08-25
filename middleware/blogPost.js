const blogPost = (req, res, next) => {
  const data = req.body;

  if (!data.title) {
    return res.status(400).json({ error: "title is required" });
  }

  if (!data.previewText) {
    return res.status(400).json({ error: "preview text is required" });
  }

  if (!data.body) {
    return res.status(400).json({ error: "body is required" });
  }

  const user = req.user;
  const blog = {};
  const fields = ["title", "previewText", "body", "tags", "hidden"];

  for (const field of fields) {
    if (data[field]) {
      blog[field] = data[field];
    }
  }

  blog.author = user._id;
  req.blog = blog;

  next();
};

module.exports = blogPost;
