/**
 * @fileoverview Defines a Mongoose model that corresponds to the 'blogs'
 * collection.
 */

const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const { formatDate } = require("../utils/utils");

const blogSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  previewText: { type: String, required: true },
  body: { type: String, required: true },
  tags: [{ type: String }],
  date: { type: Date, default: Date.now },
  hidden: { type: Boolean, default: false },
});

blogSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;

    // keep the hidden property during testing
    if (process.env.NODE_ENV !== "test") {
      delete returnedObject.hidden;
    }

    returnedObject.date = formatDate(returnedObject.date);
  },
});

blogSchema.plugin(uniqueValidator);

module.exports = mongoose.model("Blog", blogSchema);
