var express = require("express");

var router = express.Router();

const fs = require("fs");
const path = require("path");

const readFile = (filePath, encoding) =>
  new Promise((resolve, reject) => {
    fs.readFile(filePath, encoding, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });

/* GET student author file. */
router.get("/", function (req, res, next) {
  readFile("me.txt", "utf-8")
    .then((data) => data.split(","))
    .then((author) => res.send({ name: author[0], student_number: author[1] }))
    .catch((error) => {
      console.error(error.message);
      res
        .status(500)
        .json({ error: true, message: "Error finding author file!" });
    });
});

module.exports = router;
