const config = require("./utils/config");
const express = require("express");
require("express-async-errors");
const app = express();
const blogsRouter = require("./controllers/blogs");
const mongoose = require("mongoose");

mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

app.use(express.json());

app.use("/api/blogs", blogsRouter);

module.exports = app;
