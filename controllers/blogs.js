const loginRequired = require("../middleware/loginRequired");
const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

/**
 * Returns all visible blogs on the requested page. If the page property is
 * not provided in the request query string, or if the page property is not
 * a valid page number, the contents of the first page will be served.
 * @name get/
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 */
blogsRouter.get("/", async (req, res) => {
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
    .limit(blogsPerPage);

  res.json(blogs);
});

/**
 * Returns the blog that corresponds to the requested slug. If the slug is
 * invalid, a 404 response is returned.
 * @name get/:slug
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} middleware - Express middleware
 */
blogsRouter.get("/:slug", async (req, res) => {
  const slug = req.params.slug;
  const blog = await Blog.findOne({ slug });

  if (!blog) {
    return res.status(404).json({ error: "The requested blog does not exist" });
  }

  res.json(blog);
});

/**
 * Creates a blog.
 * @name get/
 * @function
 * @memberof blogsRouter
 * @param {string} path - Express path
 * @param {Function} loginRequired - Express middleware that checks whether the user is logged in
 * @param {Function} middleware - Express middleware
 */
// blogsRouter.post("/", loginRequired, async (req, res) => {
//   let page = parseInt(req.query.page);
//   page = isNaN(page) || page <= 0 ? 0 : page - 1;

//   const blogsPerPage = parseInt(process.env.POSTS_PER_PAGE);
//   const blogCount = await Blog.countDocuments({ hidden: false });

//   if (page * blogsPerPage > blogCount) {
//     page = 0;
//   }

//   const blogs = await Blog.find({ hidden: false })
//     .sort({ date: "desc" })
//     .skip(page * blogsPerPage)
//     .limit(blogsPerPage);

//   res.json(blogs);
// });

/**
 * Handles errors for the the blog router routes.
 * @name error
 * @function
 * @memberof blogsRouter
 * @param {Function} middleware - Express middleware
 */
blogsRouter.use((err, req, res, next) => {
  switch (err.name) {
    case "CastError":
      return res.status(401).json({ error: `invalid request: ${err.message}` });
    case "ValidationError":
      return res
        .status(401)
        .json({ error: `validation failed: ${err.message}` });
    case "MongoError":
      return res.status(401).json({
        error: `Mongo error: ${err.message}`,
      });
    default:
      return res.status(500).json({
        error: "an error occurred on the server - please check logs to debug",
      });
  }
});

module.exports = blogsRouter;
