/**
 * @fileoverview A set of utilites used for testing the blogs router.
 */

const Blog = require("../../models/blog");
const blogs = require("./fakeBlogs");
const utils = require("../../utils/utils");

const postsPerPage = parseInt(process.env.POSTS_PER_PAGE);

/**
 * Returns a copy of all initially inserted blogs. This includes hidden blogs.
 * @returns {UnformattedBlog}
 */
const initialBlogs = () => {
  return blogs.map((blog) => {
    return { ...blog, date: new Date(blog.date.getTime()) };
  });
};

/**
 * Returns all initially inserted blogs that are not hidden. The blogs are
 * sorted by date in descending order.
 * @returns {FormattedBlog}
 */
const visibleBlogs = () => {
  let blogs = initialBlogs();

  // sort the blogs by date in descending order
  blogs.sort((a, b) => {
    return b.date - a.date;
  });

  // convert the dates to the return format
  blogs.forEach((blog) => {
    blog.date = utils.formatDate(blog.date);
  });

  // filter out hidden blogs
  return blogs.filter((blog) => !blog.hidden);
};

/**
 * Inserts a list of dummy blogs into the database.
 */
const insertInitialBlogs = async () => {
  await Blog.create(initialBlogs());
};

/**
 * Deletes all blogs from the database.
 */
const deleteAll = async () => {
  await Blog.deleteMany({});
};

// const blogsInDb = async () => {
//   const blogs = await Blog.find({});
//   return blogs.map((blog) => blog.toJSON());
// };

/**
 * Returns the number of blogs that are not hidden.
 * @returns {number}
 */
const visibleBlogCount = async () => {
  return await Blog.countDocuments({ hidden: false });
};

/**
 * Returns all visible blogs in a paginated list. Each index of the result
 * array corresponds to a page where the number of posts is based on the
 * POSTS_PER_PAGE environment variable.
 * @returns {Array<Array<FormattedBlog>>}
 */
const pages = () => {
  const result = [];
  const blogs = visibleBlogs();

  let page;
  let i = 0;

  while (i < blogs.length) {
    page = [];

    for (let j = 0; j < postsPerPage && i < blogs.length; j++) {
      page.push(blogs[i++]);
    }

    result.push(page);
  }

  return result;
};

module.exports = {
  postsPerPage,
  insertInitialBlogs,
  deleteAll,
  visibleBlogs,
  visibleBlogCount,
  pages,
};
