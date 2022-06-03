var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({
      error: true,
      message: "Invalid query parameters. Query parameters are not permitted.",
    });
    return;
  }
  const columns = ["Country"];
  req
    .db("data")
    .distinct(columns)
    .orderBy(columns)
    .then((rows) => rows.map((obj) => obj.Country))
    .then((countries) => res.status(200).json(countries))
    .catch((error) => {
      console.log(error);
      throw new Error("An internal server error has occured");
    });
});

module.exports = router;
