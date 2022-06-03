var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var path = require("path");

const rfs = require("rotating-file-stream");

const dotenv = require("dotenv");
dotenv.config(); // get config vars

const helmet = require("helmet");

// Import swagger documentation modules
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

//Import Knex and use Knexfile defined options
const options = require("./knexfile.js");
const knex = require("knex")(options);

const errorHelper = require("./middleware/error-helper.js");

var indexRouter = require("./routes/index");
var profileRouter = require("./routes/profile/user");
var usersRouter = require("./routes/authentication/user");
var countryRouter = require("./routes/data/country");
var volcanoRouter = require("./routes/data/volcano");
var volcanoesRouter = require("./routes/data/volcanoes");
var meRouter = require("./routes/administration/me");
const createHttpError = require("http-errors");

var app = express();

var accessLogStream = rfs.createStream("access.log", {
  interval: "1d",
  path: path.join(__dirname, "logs"),
});

app.use(logger("combined", { stream: accessLogStream }));

app.use(helmet());

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
app.use("/user/?", profileRouter);
app.use("/countries", countryRouter);
app.use("/volcanoes", volcanoesRouter);
app.use("/volcano", volcanoRouter);
app.use("/me", meRouter);

app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(swaggerDocument));

// Catch 404 and forward to error handler
app.use("*", function (req, res, next) {
  next(createHttpError(404, "Page not found!"));
});

// Custom error handler
app.use(errorHelper);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render("error");
// });

module.exports = app;
