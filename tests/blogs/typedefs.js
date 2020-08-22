/**
 * @fileoverview Custom type definitions. This is so VS Code can provide
 * IntelliSense for some return types in other files.
 */

/**
 * @typedef {object} UnformattedBlog
 * @property {string} title - The title of the blog
 * @property {string} previewText - The text meant to be displayed as a preview of the body
 * @property {string} body -  The content of the blog
 * @property {Date} date - The creation date of the blog
 */

/**
 * @typedef {object} FormattedBlog
 * @property {string} title - The title of the blog
 * @property {string} previewText - The text meant to be displayed as a preview of the body
 * @property {string} body -  The content of the blog
 * @property {{month: string, day: string, year: string}} date - The creation date of the blog
 */
