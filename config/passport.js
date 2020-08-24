const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");
const { checkForCredentials } = require("../utils/utils");

const configurePassport = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      var user = await User.findById(id);
    } catch (err) {
      done(err);
    }

    done(null, user);
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // check for any missing fields
      const { credentialsProvided, message } = checkForCredentials(
        username,
        password
      );

      if (!credentialsProvided) {
        return done(null, false, message);
      }

      // try to load the user
      try {
        var user = await User.findOne({ username });
      } catch (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false, { message: "incorrect username" });
      }

      // check the password
      try {
        var same = await bcrypt.compare(password, user.passwordHash);
      } catch (err) {
        return done(err);
      }

      if (!same) {
        return done(null, false, { message: "incorrect password" });
      }

      return done(null, user);
    })
  );

  // passport.use(
  //   "admin-local",
  //   new LocalStrategy(async (username, password, done) => {
  //     // check for any missing fields
  //     const { credentialsProvided, message } = checkForCredentials(
  //       username,
  //       password
  //     );

  //     if (!credentialsProvided) {
  //       return done(null, false, message);
  //     }

  //     // make sure the user is attempting to log in as the admin
  //     if (!username == "admin") {
  //       return (
  //         null,
  //         false,
  //         { message: "admin credentials needed to access this route" }
  //       );
  //     }

  //     try {
  //       var user = User.findOne({ username });
  //     } catch (err) {
  //       return done(err);
  //     }

  //     if (!user) {
  //       return done(new Error("admin not in database"));
  //     }

  //     try {
  //       var same = await bcrypt.compare(password, user.passwordHash);
  //     } catch (err) {
  //       return done(err);
  //     }

  //     if (!same) {
  //       return done(null, false, { message: "incorrect password" });
  //     }

  //     return done(null, user);
  //   })
  // );
};

module.exports = configurePassport;
