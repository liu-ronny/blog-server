/**
 * @fileoverview The test file for the blogs router.
 */

const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../../app");

const api = supertest(app);

// require the helper after the app so that it has access to environment
// variables, which are configured at the top of the app file
const helper = require("./helper");
const usersHelper = require("../users/helper");

beforeEach(async () => {
  await helper.deleteAll();
  await helper.insertInitialBlogs();
});

afterEach(async () => {
  await helper.deleteAll();
});

afterAll(async () => {
  await mongoose.connection.db.collection("sessions").deleteMany({});
  mongoose.connection.close();
});

const createBlog = async (sessionId, blog, statusCode) => {
  const response = api.post("/api/blogs");

  if (sessionId) response.set("Cookie", `connect.sid=${sessionId}`);
  if (blog) response.send(blog);
  response.expect(statusCode);

  return (await response).body;
};

const checkBlogCountIncrease = async (increase) => {
  const blogsInDb = await helper.blogsInDb();
  const initialLength = helper.initialBlogs().length;

  expect(blogsInDb).toHaveLength(initialLength + increase);
};

describe("when there are initial blogs saved", () => {
  test("blogs are returned as JSON", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("only visible blogs are returned", async () => {
    const response = await api.get("/api/blogs");
    const page = response.body;

    page.forEach((blog) => {
      expect(blog.hidden).toBe(false);
    });
  });

  test("the latest blogs appear on the home page, sorted by date in descending order", async () => {
    const response = await api.get("/api/blogs");
    const page = response.body;
    const firstPage = helper.visibleBlogs().slice(0, helper.postsPerPage);

    firstPage.forEach((blog) => {
      expect(page).toContainEqual(expect.objectContaining(blog));
    });
  });

  test("the number of blogs on the home page matches the number specified by an environment variable", async () => {
    const response = await api.get("/api/blogs");
    const page = response.body;
    expect(page).toHaveLength(helper.postsPerPage);
  });

  test("each blog has an author field that contains the author name and id", async () => {
    const response = await api.get("/api/blogs");
    const page = response.body;

    page.forEach((blog) => {
      expect(blog.author).toBeDefined();
      expect(blog.author.name).toBeDefined();
      expect(blog.author.id).toBeDefined();
    });
  });

  test("pagination works and is the default when no query parameters are set", async () => {
    const pages = helper.pages();
    const checkPage = (expectedPage, page) => {
      expect(page).toHaveLength(expectedPage.length);

      expectedPage.forEach((blog) => {
        expect(page).toContainEqual(expect.objectContaining(blog));
      });
    };

    const firstPage = pages[0];

    // negative page number should return the first page
    let page = (await api.get("/api/blogs").query({ page: "-1" }).expect(200))
      .body;
    checkPage(firstPage, page);

    // a page number of 0 should return the first page
    page = (await api.get("/api/blogs").query({ page: "0" }).expect(200)).body;
    checkPage(firstPage, page);

    // a valid page number should return that page
    for (let i = 0; i < pages.length; i++) {
      page = (
        await api
          .get("/api/blogs")
          .query({ page: `${i + 1}` })
          .expect(200)
      ).body;
      checkPage(pages[i], page);
    }

    // a page number greater than the actual number of pages should return the first page
    page = (
      await api
        .get("/api/blogs")
        .query({ page: `${pages.length + 1}` })
        .expect(200)
    ).body;
    checkPage(firstPage, page);

    // an invalid page number should return the first page
    page = (await api.get("/api/blogs").query({ page: "1a" }).expect(200)).body;
    checkPage(firstPage, page);

    page = (await api.get("/api/blogs").query({ page: "abcdefg" }).expect(200))
      .body;
    checkPage(firstPage, page);

    page = (
      await api.get("/api/blogs").query({ page: "199321348732378" }).expect(200)
    ).body;
    checkPage(firstPage, page);

    // a request without a specified page should return the first page
    page = (await api.get("/api/blogs").expect(200)).body;
    checkPage(firstPage, page);
  });

  test("querying by tags works", async () => {
    const doggoBlogs = (await helper.blogsInDb())
      .filter(
        (blog) => blog.tags && blog.tags.includes("doggo") && !blog.hidden
      )
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id.toString());

    // check that querying by the doggo tag returns all doggo posts
    const response = await api
      .get("/api/blogs")
      .query({ tag: "doggo" })
      .expect(200);
    const blogs = response.body
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id.toString());

    expect(blogs).toEqual(doggoBlogs);
  });

  test("querying by tags takes precedence over querying by page", async () => {
    const doggoBlogs = (await helper.blogsInDb())
      .filter(
        (blog) => blog.tags && blog.tags.includes("doggo") && !blog.hidden
      )
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id.toString());

    let response = await api
      .get("/api/blogs")
      .query({ tag: "doggo", page: "1" })
      .expect(200);
    let blogs = response.body
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id.toString());

    expect(blogs).toEqual(doggoBlogs);
  });

  test("querying by user works", async () => {
    const admin = usersHelper.admin();
    const adminInDb = await usersHelper.adminInDb();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const adminBlogs = (await helper.blogsInDb())
      .filter((blog) => blog.author.toString() === adminInDb.id.toString())
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()));

    // check that a query for all of the admin's blogs works
    let response = await api
      .get("/api/blogs")
      .query({ user: adminInDb.id })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(200);

    let blogs = response.body
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id);

    const allAdminBlogs = adminBlogs.map((blog) => blog.id);

    expect(blogs).toEqual(allAdminBlogs);

    // check that a query for the admin's visible blogs works
    response = await api
      .get("/api/blogs")
      .query({ user: adminInDb.id, filter: "visible" })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(200);

    blogs = response.body
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id);

    const visibleAdminBlogs = adminBlogs
      .filter((blog) => !blog.hidden)
      .map((blog) => blog.id);

    expect(blogs).toEqual(visibleAdminBlogs);

    // check that a query for the admin's hidden blogs works
    response = await api
      .get("/api/blogs")
      .query({ user: adminInDb.id, filter: "hidden" })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(200);

    blogs = response.body
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id);

    const hiddenAdminBlogs = adminBlogs
      .filter((blog) => blog.hidden)
      .map((blog) => blog.id);

    expect(blogs).toEqual(hiddenAdminBlogs);
  });

  test("querying by user with an invalid filter parameter fails with status 400", async () => {
    const admin = usersHelper.admin();
    const adminInDb = await usersHelper.adminInDb();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    const response = await api
      .get("/api/blogs")
      .query({ user: adminInDb.id, filter: "invalid" })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  test("querying by user while not logged in fails with status 401", async () => {
    const adminInDb = await usersHelper.adminInDb();

    const response = await api
      .get("/api/blogs")
      .query({ user: adminInDb.id })
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test("querying by user while logged in as another user fails with status 401", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const nonExistentUserId = await usersHelper.nonExistentId();

    const response = await api
      .get("/api/blogs")
      .query({ user: nonExistentUserId.toString() })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(401);

    expect(response.body.error).toBeDefined();
  });

  test("querying by malformed user id while logged in as another user fails with status 400", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    const response = await api
      .get("/api/blogs")
      .query({ user: "invalidid" })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  test("querying by user takes precedence over other query parameters", async () => {
    const admin = usersHelper.admin();
    const adminInDb = await usersHelper.adminInDb();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const adminBlogs = (await helper.blogsInDb())
      .filter((blog) => blog.author.toString() === adminInDb.id.toString())
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id);

    let response = await api
      .get("/api/blogs")
      .query({ user: adminInDb.id, tag: "doggo", page: "2" })
      .set("Cookie", `connect.sid=${sessionId}`)
      .expect(200);

    let blogs = response.body
      .sort((a, b) => a.id.toString().localeCompare(b.id.toString()))
      .map((blog) => blog.id);

    expect(blogs).toEqual(adminBlogs);
  });
});

describe("retrieving a blog via its slug", () => {
  test("returns a JSON response", async () => {
    const blogs = helper.visibleBlogs();
    const slug = blogs[0].slug;

    await api
      .get(`/api/blogs/${slug}`)
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("works when the slug is valid", async () => {
    const blogs = helper.visibleBlogs();

    for (let blog of blogs) {
      const slug = blog.slug;
      const response = await api.get(`/api/blogs/${slug}`).expect(200);
      const retrievedBlog = response.body;

      expect(retrievedBlog).toEqual(expect.objectContaining(blog));
      expect(retrievedBlog.author).toBeDefined();
      expect(retrievedBlog.author.name).toBeDefined();
      expect(retrievedBlog.author.id).toBeDefined();
    }
  });

  test("fails with status 404 when the slug is valid but the blog is hidden", async () => {
    const blogs = helper.hiddenBlogs();

    for (let blog of blogs) {
      const slug = blog.slug;
      const response = await api.get(`/api/blogs/${slug}`).expect(404);

      expect(response.body).not.toEqual(expect.objectContaining(blog));
    }
  });

  test("fails with status 404 when the slug is invalid", async () => {
    const invalidSlug = "this-blog-does-not-exist";
    await api.get(`/api/blogs/${invalidSlug}`).expect(404);
  });
});

describe("creating blogs", () => {
  test("works when a user is logged in", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    const blog = {
      title: "doggo doggo doggo",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };

    const newBlog = await createBlog(sessionId, blog, 201);

    expect(newBlog).toEqual(expect.objectContaining(blog));
    await checkBlogCountIncrease(1);

    // check that the blog has the correct author
    expect(newBlog.author).toEqual(
      expect.objectContaining({ name: admin.username })
    );

    // check that the user is the only one who has the blog added to his/her list of blogs
    const usersInDb = await usersHelper.usersInDb();

    for (let user of usersInDb) {
      for (let i = 0; i < user.blogs.length; i++) {
        const blog = user.blogs[i];

        user.blogs[i] = blog.toString();
      }

      if (user.username === "admin") {
        expect(user.blogs).toContain(newBlog.id);
      } else {
        expect(user.blogs).not.toContain(newBlog.id);
      }
    }
  });

  test("fails with status code 401 when a user is not logged in", async () => {
    const blog = {
      title: "doggo doggo doggo",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };
    await createBlog(null, blog, 401);
    await checkBlogCountIncrease(0);
  });

  test("fails with status code 400 if any required properties are not provided when a user is logged in", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    // try to create a blog without a title
    let blog = {
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };
    await createBlog(sessionId, blog, 400);
    await checkBlogCountIncrease(0);

    // try to create a blog without a preview text
    blog = {
      title: "doggo doggo doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };
    await createBlog(sessionId, blog, 400);
    await checkBlogCountIncrease(0);

    // try to create a blog without a body
    blog = {
      title: "doggo doggo doggo",
      previewText: "doggo",
      tags: ["doggo", "woof"],
    };
    await createBlog(sessionId, blog, 400);
    await checkBlogCountIncrease(0);

    // try to create a blog without any of the required properties
    blog = {
      tags: ["doggo", "woof"],
    };
    await createBlog(sessionId, blog, 400);
    await checkBlogCountIncrease(0);

    // try to create an empty blog
    blog = {};
    await createBlog(sessionId, blog, 400);
    await checkBlogCountIncrease(0);
  });
});

describe("editing blogs", () => {
  const editBlog = async (sessionId, blogId, blog, statusCode) => {
    const response = api.put(`/api/blogs/${blogId}`);

    if (sessionId) response.set("Cookie", `connect.sid=${sessionId}`);
    if (blog) response.send(blog);
    response.expect(statusCode);

    return (await response).body;
  };

  test("works when a user is logged in", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    const blogs = await helper.blogsInDb();
    const blog = blogs[0];
    const blogId = blog.id;

    const edit = {
      title: "My edited title",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };

    await editBlog(sessionId, blogId, edit, 204);

    // check that the original post is only one changed in the db
    const edittedBlogs = await helper.blogsInDb();

    for (let edittedBlog of edittedBlogs) {
      if (edittedBlog.id.toString() === blogId.toString()) {
        expect(edittedBlog).toEqual(expect.objectContaining(edit));
      } else {
        expect(blogs).toContainEqual(edittedBlog);
      }
    }

    await checkBlogCountIncrease(0);
  });

  test("fails with status code 401 when a user is not logged in", async () => {
    const blogs = await helper.blogsInDb();
    const blog = blogs[0];
    const blogId = blog.id;

    const edit = {
      title: "My edited title",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };

    await editBlog(null, blogId, edit, 401);

    // check that the posts in the db are unchanged
    const edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);

    await checkBlogCountIncrease(0);
  });

  test("fails with status code 400 if any required properties are not provided when a user is logged in", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    const blogs = await helper.blogsInDb();
    const blog = blogs[0];
    const blogId = blog.id;

    // try to submit an edit without a title
    let edit = {
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };
    await editBlog(sessionId, blogId, edit, 400);
    await checkBlogCountIncrease(0);
    let edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);

    // try to submit an edit without a preview text
    edit = {
      title: "doggo doggo doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };
    await editBlog(sessionId, blogId, edit, 400);
    await checkBlogCountIncrease(0);
    edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);

    // try to submit an edit without a body
    edit = {
      title: "doggo doggo doggo",
      previewText: "doggo",
      tags: ["doggo", "woof"],
    };
    await editBlog(sessionId, blogId, edit, 400);
    await checkBlogCountIncrease(0);
    edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);

    // try to submit an edit without any of the required properties
    edit = {
      tags: ["doggo", "woof"],
    };
    await editBlog(sessionId, blogId, edit, 400);
    await checkBlogCountIncrease(0);
    edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);

    // try to submit an empty edit
    edit = {};
    await editBlog(sessionId, blogId, edit, 400);
    await checkBlogCountIncrease(0);
    edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);
  });

  test("fails with status code 400 if the provided blog id is malformed", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const blogs = await helper.blogsInDb();

    const edit = {
      title: "My edited title",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };

    await editBlog(sessionId, "invalidblogid", edit, 400);
    const edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);
    await checkBlogCountIncrease(0);
  });

  test("fails with status code 404 if the provided blog id does not exist", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const blogs = await helper.blogsInDb();

    const edit = {
      title: "My edited title",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };
    const nonExistentBlogId = await helper.nonExistentId();

    await editBlog(sessionId, nonExistentBlogId, edit, 404);
    const edittedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(edittedBlogs);
    await checkBlogCountIncrease(0);
  });

  test("fails with status code 401 if one user attempts to edits another's post", async () => {
    const otherUser = { username: "testuser", password: "testpassword" };
    const otherUserSessionId = await usersHelper.login(
      api,
      otherUser.username,
      otherUser.password
    );

    const blogs = await helper.blogsInDb();
    const blog = blogs[0];
    const blogId = blog.id;

    const edit = {
      title: "My edited title",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };

    // try to edit the admin's blog as testuser
    await editBlog(otherUserSessionId, blogId, edit, 401);

    const updatedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(updatedBlogs);
  });
});

describe("deleting blogs", () => {
  const deleteBlog = async (sessionId, blogId, statusCode) => {
    const response = api.delete(`/api/blogs/${blogId}`);

    if (sessionId) response.set("Cookie", `connect.sid=${sessionId}`);
    response.expect(statusCode);

    return (await response).body;
  };

  test("works when a user is logged in", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );

    let blogs = await helper.blogsInDb();
    const blog = blogs[0];
    const blogId = blog.id;

    await deleteBlog(sessionId, blogId, 204);

    // check that retrieving the post by its slug no longer works
    await api.get(`/api/blogs/${blog.slug}`).expect(404);

    // check that the blog is no longer in the db
    const updatedBlogs = await helper.blogsInDb();

    for (const updatedBlog of updatedBlogs) {
      expect(blogs).toContainEqual(updatedBlog);
    }

    expect(updatedBlogs).not.toContainEqual(blog);

    // check that the blog count has gone down by one
    await checkBlogCountIncrease(-1);
  });

  test("fails with status code 401 when a user is not logged in", async () => {
    const blogs = await helper.blogsInDb();
    const blog = blogs[0];
    const blogId = blog.id;

    await deleteBlog(null, blogId, 401);

    const updatedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(updatedBlogs);

    await checkBlogCountIncrease(0);
  });

  test("fails with status code 400 if the provided blog id is malformed", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const blogs = await helper.blogsInDb();

    await deleteBlog(sessionId, "invalidblogid", 400);

    const updatedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(updatedBlogs);

    await checkBlogCountIncrease(0);
  });

  test("fails with status code 404 if the provided blog id does not exist", async () => {
    const admin = usersHelper.admin();
    const sessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const blogs = await helper.blogsInDb();
    const nonExistentBlogId = await helper.nonExistentId();

    await deleteBlog(sessionId, nonExistentBlogId, 404);

    const updatedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(updatedBlogs);

    await checkBlogCountIncrease(0);
  });

  test("fails with status code 401 if one user attempts to deletes another's post", async () => {
    const admin = usersHelper.admin();
    const otherUser = { username: "testuser", password: "testpassword" };
    const adminSessionId = await usersHelper.login(
      api,
      admin.username,
      admin.password
    );
    const otherUserSessionId = await usersHelper.login(
      api,
      otherUser.username,
      otherUser.password
    );

    const blog = {
      title: "doggo doggo doggo",
      previewText: "doggo",
      body: "doggo doggo woof woof pupper doogo",
      tags: ["doggo", "woof"],
    };

    const newAdminBlog = await createBlog(adminSessionId, blog, 201);
    const blogs = await helper.blogsInDb();

    // try to delete the admin's blog as testuser
    await deleteBlog(otherUserSessionId, newAdminBlog.id, 401);

    const updatedBlogs = await helper.blogsInDb();
    expect(blogs).toEqual(updatedBlogs);
  });
});
