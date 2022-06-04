var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var path = require("path");
var cors = require("cors");

const rfs = require("rotating-file-stream");

const dotenv = require("dotenv");
dotenv.config(); // get config vars

const helmet = require("helmet");

//Import custom error handler and httpError handler
const createHttpError = require("http-errors");
const errorHelper = require("./middleware/error-helper.js");

// Import swagger documentation modules
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

//Import Knex and use Knexfile defined options
const options = require("./knexfile.js");
const knex = require("knex")(options);

// Import endpoint route modules
var indexRouter = require("./routes/index");
var profileRouter = require("./routes/profile/user");
var usersRouter = require("./routes/authentication/user");
var countryRouter = require("./routes/data/country");
var volcanoRouter = require("./routes/data/volcano");
var volcanoesRouter = require("./routes/data/volcanoes");
var meRouter = require("./routes/administration/me");

var app = express();

app.use(cors());

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
app.use("/user", usersRouter);
app.use("/user/?", profileRouter);
app.use("/countries", countryRouter);
app.use("/volcanoes", volcanoesRouter);
app.use("/volcano", volcanoRouter);
app.use("/me", meRouter);

// Serve swagger docs on index route
app.use("/", swaggerUi.serve); // serve swagger on root
app.get("/", swaggerUi.setup(swaggerDocument)); // use swagger router handler for files

// Catch 404 and forward to error custom handler
app.use("*", function (req, res, next) {
  next(createHttpError(404, "Page not found!"));
});

// Use the custom error handler
app.use(errorHelper);

module.exports = app;
