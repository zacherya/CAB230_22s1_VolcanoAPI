var express = require("express");
const { requiresLaxAuthentication } = require("../../helpers/accesstoken");
var router = express.Router();

/* GET users listing. */
router.get("/:VolcanoId", requiresLaxAuthentication, function (req, res, next) {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({
      error: true,
      message: "Invalid query parameters. Query parameters are not permitted.",
    });
    return;
  }
  if (!req.params.VolcanoId) {
    res.status(406).json({
      error: true,
      message: "Volcano ID is required.",
    });
    return;
  }
  const order = ["id"];
  const filter = {
    id: req.params.VolcanoId,
  };
  const columns = [
    "id",
    "name",
    "country",
    "region",
    "subregion",
    "last_eruption",
    "summit",
    "elevation",
    "latitude",
    "longitude",
  ];
  // If user is autenticated provide population data
  if (req.user !== undefined) {
    columns.push(
      "population_5km",
      "population_10km",
      "population_30km",
      "population_100km"
    );
  }
  req
    .db("data")
    .select(columns)
    .where(filter)
    .orderBy(order)
    .limit(1)
    .then((rows) => {
      if (rows.length < 1) {
        res.status(404).json({
          error: true,
          message: `Volcano with ID: ${req.params.VolcanoId} not found.`,
        });
        return;
      }
      return rows[0];
    })
    .then((volcano) => res.status(200).json(volcano))
    .catch((error) => {
      console.log(error);
      throw new Error("An internal server error has occured");
    });
});

module.exports = router;
