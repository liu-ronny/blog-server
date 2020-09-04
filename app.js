/**
 * @fileoverview The entry point for the application. Route handlers are
 * modularized into several Router middlewares.
 * @see {@link http://expressjs.com/en/guide/using-middleware.html#middleware.router|Express documentation}
 */

const env = require("./config/environment");
const express = require("express");
require("express-async-errors");
const app = express();
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const mongoose = require("mongoose");
const passport = require("passport");
const configurePassport = require("./config/passport");
const blogsRouter = require("./controllers/blogs");
const loginRouter = require("./controllers/login");
const logoutRouter = require("./controllers/logout");
const usersRouter = require("./controllers/users");
const sessionsRouter = require("./controllers/sessions");

mongoose.connect(env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

app.use(express.json());

const twentyFourHours = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: env.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      maxAge: twentyFourHours,
    },
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      secret: env.SESSION_STORE_SECRET,
    }),
  })
);

configurePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/blogs", blogsRouter);
app.use("/api/login", loginRouter);
app.use("/api/logout", logoutRouter);
app.use("/api/users", usersRouter);
app.use("/api/sessions", sessionsRouter);

module.exports = app;
