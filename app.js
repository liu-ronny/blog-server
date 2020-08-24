const env = require("./config/environment");
const express = require("express");
require("express-async-errors");
const app = express();
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const configurePassport = require("./config/passport");
const blogsRouter = require("./controllers/blogs");
const loginRouter = require("./controllers/login");
const usersRouter = require("./controllers/users");

mongoose.connect(env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const twentyFourHours = 86400000;
app.use(
  session({
    secret: process.env.SECRET,
    cookie: {
      httpOnly: true,
      maxAge: twentyFourHours,
    },
    resave: false,
    saveUninitialized: false,
  })
);

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/blogs", blogsRouter);
app.use("/api/login", loginRouter);
app.use("/api/users", usersRouter);

module.exports = app;
