var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// Import swagger documentation modules
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

//Import Knex and use Knexfile defined options
const options = require("./knexfile.js");
const knex = require("knex")(options);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/authentication/user");
var countryRouter = require("./routes/data/country");
var volcanoRouter = require("./routes/data/volcano");
var volcanoesRouter = require("./routes/data/volcanoes");
var meRouter = require("./routes/administration/me");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  req.db = knex;
  next();
});

// Define endpoint routes
// app.use("/", indexRouter);
//https://simonplend.com/how-to-create-an-error-handler-for-your-express-api/
app.use("/user", usersRouter);
app.use("/countries", countryRouter);
app.use("/volcanoes", volcanoesRouter);
app.use("/volcano", volcanoRouter);
app.use("/me", meRouter);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
