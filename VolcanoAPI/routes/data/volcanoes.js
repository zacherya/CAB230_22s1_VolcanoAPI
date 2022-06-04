var express = require("express");
const createHttpError = require("http-errors");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  if (!req.query.country) {
    res.status(400).json({
      error: true,
      message: "Country is a required query parameter.",
    });
    return;
  }

  const requiresQueryKeys = ["country", "populatedWithin"];
  const outliers = Object.keys(req.query).filter(
    (queryKey) => !requiresQueryKeys.includes(queryKey)
  );
  if (outliers.length > 0) {
    res.status(400).json({
      error: true,
      message:
        "Invalid query parameters. Only country and populatedWithin are permitted.",
    });
    return;
  }

  var populationFilter;

  if (req.query.populatedWithin) {
    const permitted = ["5km", "10km", "30km", "100km"];
    if (!permitted.includes(req.query.populatedWithin)) {
      res.status(400).json({
        error: true,
        message: `Invalid value for populatedWithin: ${req.query.populatedWithin}. Only: 5km,10km,30km,100km are permitted.`,
      });
      return;
    } else {
      populationFilter = `population_${req.query.populatedWithin}`;
    }
  }

  const columns = ["id", "name", "country", "region", "subregion"];
  const order = ["id"];
  const filter = { country: req.query.country };
  req
    .db("data")
    .select(columns)
    .where(function () {
      if (populationFilter) {
        this.where(populationFilter, ">", 0).andWhere(filter);
      } else {
        this.where(filter);
      }
    })
    .orderBy(order)
    .then((countries) => res.status(200).json(countries))
    .catch((error) => {
      console.log(error);
      throw new Error("An internal server error has occured");
    });
});

module.exports = router;
