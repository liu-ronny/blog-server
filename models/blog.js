/**
 * @fileoverview Defines a Mongoose model that corresponds to the 'blogs'
 * collection in MongoDB.
 */

const env = require("../config/environment");
const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const slugify = require("slugify");
const { formatDate } = require("../utils/utils");

const blogSchema = new mongoose.Schema({
  slug: { type: String, unique: true },
  title: { type: String, required: true },
  previewText: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  date: { type: Date, default: Date.now },
  hidden: { type: Boolean, default: false },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

blogSchema.pre("save", function (next) {
  if (this.title) {
    this.slug = slugify(this.title, { lower: true });
  }

  next();
});

blogSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;

    // avoid deleting certain properties in a test environment
    if (env.NODE_ENV !== "test") {
      delete returnedObject.hidden;
    }

    returnedObject.date = formatDate(returnedObject.date);
  },
});

blogSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Blog", blogSchema);
