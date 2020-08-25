const mongoose = require("mongoose");
const Blog = require("../models/blog");

const userBlogs = async (req, res, next) => {
  const user = req.user;
  const filter = req.query.filter;
  let userId = req.query.user;

  if (userId) {
    try {
      userId = mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!user || userId.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ error: "you are not logged in as the specified user" });
    }

    switch (filter) {
      case "visible":
        var query = Blog.find({ author: userId, hidden: false });
        break;
      case "hidden":
        var query = Blog.find({ author: userId, hidden: true });
        break;
      case undefined:
        var query = Blog.find({ author: userId });
        break;
      default:
        return res.status(400).json({
          error: "visibility must be omitted, 'visible', or 'hidden'",
        });
    }

    const blogs = await query;

    return res.json(blogs);
  }

  next();
};

module.exports = userBlogs;
