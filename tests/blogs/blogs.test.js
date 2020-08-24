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

beforeEach(async () => {
  await helper.deleteAll();
  await helper.insertInitialBlogs();
});

afterEach(async () => {
  await helper.deleteAll();
});

afterAll(() => {
  mongoose.connection.close();
});

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

  test("pagination works", async () => {
    const pages = helper.pages();
    const checkPage = (expectedPage, page) => {
      expect(page).toHaveLength(expectedPage.length);

      expectedPage.forEach((blog) => {
        expect(page).toContainEqual(expect.objectContaining(blog));
      });
    };

    const firstPage = pages[0];

    // negative page number should return the first page
    let page = (await api.get("/api/blogs").query({ page: "-1" })).body;
    checkPage(firstPage, page);

    // a page number of 0 should return the first page
    page = (await api.get("/api/blogs").query({ page: "0" })).body;
    checkPage(firstPage, page);

    // a valid page number should return that page
    for (let i = 0; i < pages.length; i++) {
      page = (await api.get("/api/blogs").query({ page: `${i + 1}` })).body;
      checkPage(pages[i], page);
    }

    // a page number greater than the actual number of pages should return the first page
    page = (await api.get("/api/blogs").query({ page: `${pages.length + 1}` }))
      .body;
    checkPage(firstPage, page);

    // an invalid page number should return the first page
    page = (await api.get("/api/blogs").query({ page: "1a" })).body;
    checkPage(firstPage, page);

    page = (await api.get("/api/blogs").query({ page: "abcdefg" })).body;
    checkPage(firstPage, page);

    page = (await api.get("/api/blogs").query({ page: "199321348732378" }))
      .body;
    checkPage(firstPage, page);

    // a request without a specified page should return the first page
    page = (await api.get("/api/blogs")).body;
    checkPage(firstPage, page);
  });
});

describe("retrieving a blog via its slug", () => {
  test("works when the slug is valid", async () => {
    const blogs = helper.visibleBlogs();

    for (let blog of blogs) {
      const slug = blog.slug;
      const response = await api.get(`/api/blogs/${slug}`).expect(200);

      expect(response.body).toEqual(expect.objectContaining(blog));
    }
  });

  test("fails with status 404 when the slug is invalid", async () => {
    const invalidSlug = "this-blog-does-not-exist";
    await api.get(`/api/blogs/${invalidSlug}`).expect(404);
  });
});
