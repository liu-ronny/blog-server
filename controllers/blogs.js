const loginRequired = require("../middleware/loginRequired");
const blogPost = require("../middleware/blogPost");
const userBlogs = require("../middleware/userBlogs");
const tags = require("../middleware/tags");
const blogBySlug = require("../middleware/blogBySlug");
const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

/**
 * Returns all visible blogs on the requested page. The tag property takes
 * precendence over the page property. If the tag property is specified, the
 * blogs with that tag will be returned. If the tag property is not specified,
 * it is assumed that the query is a page query.If the page property is not
 * provided in the request query string, or if the page property is not a
 * valid page number, the contents of the first page will be served.
 * @name get/
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 *
 * @example
 * // returns the first page of the blog
 * "/api/blogs"
 *
 * // returns the third page of the blog
 * "/api/blogs?page=3"
 *
 * // returns the first page of the blog
 * "/api/blogs?page=invalid"
 *
 * // returns all blogs with the tag javascript
 * "/api/blogs?tag=javascript"
 *
 * // returns all blogs with the tag javascript
 * "/api/blogs?tag=javascript&page=1"
 *
 */
blogsRouter.get("/", userBlogs, tags, async (req, res) => {
  let page = parseInt(req.query.page);
  page = isNaN(page) || page <= 0 ? 0 : page - 1;

  const blogsPerPage = parseInt(process.env.POSTS_PER_PAGE);
  const blogCount = await Blog.countDocuments({ hidden: false });

  if (page * blogsPerPage > blogCount) {
    page = 0;
  }

  const blogs = await Blog.find({ hidden: false })
    .sort({ date: "desc" })
    .skip(page * blogsPerPage)
    .limit(blogsPerPage)
    .populate("author", "-blogs -username");

  res.json(blogs);
});

/**
 * Returns the blog that corresponds to the specified slug. If the slug is
 * invalid, a 404 response is returned.
 * @name get/:slug
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 */
blogsRouter.get("/:slug", blogBySlug, async (req, res) => {
  res.json(req.blog);

  // let withCsrf = req.query.withCsrf;

  // if (withCsrf && withCsrf.toLowerCase() === "true") {
  // }
});

/**
 * Edits the blog that corresponds to the specified id.
 * @name put/:id
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} loginRequired - Express middleware that checks whether the user is logged in
 * @param {Function} blogPost - Express middleware that creates a req.blog object if the necessary fields are provided in the request
 * @param {Function} middleware - Express middleware
 */
blogsRouter.put("/:id", loginRequired, blogPost, async (req, res) => {
  const user = req.user;
  const blog = req.blog;
  const id = req.params.id;

  const savedBlog = await Blog.findById(id);

  if (!savedBlog) {
    return res.status(404).json({ error: "the blog to edit does not exist" });
  }

  if (savedBlog.author.toString() !== user._id.toString()) {
    return res
      .status(401)
      .json({ error: "you do not have permission to edit this post" });
  }

  for (const [field, value] of Object.entries(blog)) {
    savedBlog[field] = value;
  }

  await savedBlog.save();

  res.status(204).end();
});

/**
 * Deletes the blog that corresponds to the specified id. This deletes both the
 * blog as well as the author's reference to the the blog from the database.
 * @name delete/:id
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} loginRequired - Express middleware that checks whether the user is logged in
 * @param {Function} middleware - Express middleware
 */
blogsRouter.delete("/:id", loginRequired, async (req, res) => {
  const user = req.user;
  const id = req.params.id;

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({ error: "the blog to delete does not exist" });
  }

  if (blog.author.toString() !== user._id.toString()) {
    return res
      .status(401)
      .json({ error: "you do not have permission to delete this post" });
  }

  await Blog.findByIdAndDelete(id);

  user.blogs = user.blogs.map((blogId) => blogId.toString() !== id.toString());
  await user.save();

  res.status(204).end();
});

/**
 * Creates a blog.
 * @name get/
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} loginRequired - Express middleware that checks whether the user is logged in
 * @param {Function} blogPost - Express middleware that creates a req.blog object if the necessary fields are provided in the request
 * @param {Function} middleware - Express middleware
 */
blogsRouter.post("/", loginRequired, blogPost, async (req, res) => {
  const user = req.user;
  const blog = req.blog;

  let newBlog = await Blog.create(blog);
  newBlog = await newBlog.populate("author", "-blogs -username").execPopulate();

  user.blogs.push(newBlog._id);
  await user.save();

  res.status(201).json(newBlog);
});

/**
 * Handles errors for the the blog router routes.
 * @name error
 * @function
 * @memberof blogsRouter
 * @param {Function} middleware - Express middleware
 */
blogsRouter.use((err, req, res, next) => {
  // console.log(err);
  switch (err.name) {
    case "CastError":
      return res.status(400).json({ error: `invalid request: ${err.message}` });
    case "ValidationError":
      return res
        .status(400)
        .json({ error: `validation failed: ${err.message}` });
    case "MongoError":
      return res.status(400).json({
        error: `Mongo error: ${err.message}`,
      });
    default:
      return res.status(500).json({
        error: "an error occurred on the server - please check logs to debug",
      });
  }
});

module.exports = blogsRouter;
