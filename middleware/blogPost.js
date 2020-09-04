/**
 * Middleware that populates the request object with a blog property. This
 * creates an object that represents a new blog using the request body. It
 * validates the request body and returns a 400 status code in the response
 * if the body does not have the required fields. The resulting req.blog object
 * will only use certain pre-defined fields and will ignore other parameters
 * sent in the request body.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
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
