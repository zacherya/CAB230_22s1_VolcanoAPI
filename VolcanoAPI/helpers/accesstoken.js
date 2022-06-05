const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");

/**
 * Get the token secret from the environment variable
 * @returns {string} The secret used to sign JWT tokens
 */
function getTokenSecret() {
  // Generated using:
  //    require('crypto').randomBytes(64).toString('hex')
  // in node.js console
  return process.env.TOKEN_SECRET;
}

/**
 * Create the token payload information with token and expiry set
 * @param {string} email The users email address used to inject into the token payload for validation
 * @returns {object} The custom token payload with the token and expiry data
 */
function createTokenPayload(email) {
  const tokenSecret = getTokenSecret();
  const token = jwt.sign({ email: email }, tokenSecret, {
    expiresIn: "24h" /* Short hand for: Date.Now() + 60*60*24 (S*M*H) */,
  });
  return { token: token, expires: 24 * 60 * 60 /* Expires in 24hours */ };
}

/**
 * A private function that injects the user data into the required middleware/s
 * This is called either via the requiresLaxAuthentication or requiresStrictAuthentication functions
 * @param {object} req The request object passed from the calling middleware
 * @param {object} res The response object passed from the calling middleware
 * @param {any} next The next middleware in the processing order to call
 * @returns {null} Returns nothing but will proceed to the next middleware when next() is called
 */
function injectAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  let pattern = /\bBearer\s\b[A-Za-z0-9\-\._~\+\/]+=*/;
  let isBearer = pattern.test(authHeader);
  if (!isBearer) {
    next(createHttpError(401, "Authorization header is malformed"));
    return;
  }

  const token = authHeader && authHeader.split(" ")[1];
  jwt.verify(token, getTokenSecret(), (err, decoded) => {
    if (err) {
      switch (err.name) {
        case "TokenExpiredError":
          next(createHttpError(401, "JWT token has expired"));
          break;
        case "JsonWebTokenError":
          next(createHttpError(401, "Invalid JWT token"));
          break;
        default:
          next(createHttpError(500, "Error verifying JWT token"));
          break;
      }
      return;
    }
    try {
      req.db
        .select("email", "firstName", "lastName", "dob", "address")
        .from("users")
        .where("email", "=", decoded.email)
        .then((users) => {
          if (users.length === 0) {
            //if the user isn't valid/exist anymore then technically invalidate the token
            next(createHttpError(401, "Invalid JWT token"));
          } else {
            req.user = users[0];
            next();
          }
        });
    } catch (err) {
      //Generically handle the error by assuming all errors are due to invalid JWT token
      console.log(`Error: ${err.message}`);
      next(
        createHttpError(
          500,
          "An unexpected error occurred during token validation"
        )
      );
    }
  });
}

/**
 * A public middleware interceptor that will inject the user data into the request object.
 * This will only inject authentication if a token is present, if it doesn't the next middleware will
 * still run but may be limited in it's functionality
 * This should be used to protect some aspects of an endpoint but not it's entirety.
 * @param {object} req The request object passed from the calling middleware
 * @param {object} res The response object passed from the calling middleware
 * @param {any} next The next middleware in the processing order to call
 * @returns {null} Returns nothing but will proceed to the next middleware when next() is called
 */
function requiresLaxAuthentication(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (authHeader === undefined) {
    //No auth header provided, as this is lax, we allow the middleware to continue to the next
    next();
    return;
  }

  injectAuth(req, res, next);
}

/**
 * A public middleware interceptor that will inject the user data into the request object.
 * This will only inject authentication if a token is present, if it isn't then an error will be
 * thrown and the calling middleware will not be executed.
 * This should be used to protect endpoints from being used without a valid token.
 * @param {object} req The request object passed from the calling middleware
 * @param {object} res The response object passed from the calling middleware
 * @param {any} next The next middleware in the processing order to call
 * @returns {null} Returns nothing but will proceed to the next middleware when next() is called
 */
function requiresStrictAuthentication(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (authHeader === undefined) {
    //No auth header provided, as this is strict, we return a 401
    next(
      createHttpError(401, "Authorization header ('Bearer token') not found")
    );
    return;
  }

  injectAuth(req, res, next);
}

module.exports = {
  createTokenPayload,
  requiresLaxAuthentication,
  requiresStrictAuthentication,
};
