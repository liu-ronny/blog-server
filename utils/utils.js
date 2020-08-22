/**
 * Converts a JavaScript Date object into an object that contains the month as
 * a word, the date as a 2-digit string, and the year as a numeric string.
 * @param {Date} date - The date to convert
 * @returns {{month: string, day: string, year: string}}
 * @example
 * // returns { Month: "August", Day: "08", Year: "2020" }
 * formatDate(new Date(2020, 8, 10))
 */
const formatDate = (date) => {
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.toLocaleString("en-US", { day: "2-digit" });
  const year = date.toLocaleString("en-US", { year: "numeric" });

  return { month, day, year };
};

module.exports = {
  formatDate,
};
