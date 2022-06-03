const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");

function getTokenSecret() {
  // Generated using:
  //    require('crypto').randomBytes(64).toString('hex')
  // in node.js console
  return process.env.TOKEN_SECRET;
}

function createTokenPayload(email) {
  const tokenSecret = getTokenSecret();
  const token = jwt.sign({ email: email }, tokenSecret, {
    expiresIn: "24h" /* Short hand for: Date.Now() + 60*60*24 (S*M*H) */,
  });
  console.log(
    jwt.sign({ email: email }, tokenSecret, {
      expiresIn: "-24h" /* Short hand for: Date.Now() + 60*60*24 (S*M*H) */,
    })
  );
  return { token: token, expires: 24 * 60 * 60 /* Expires in 24hours */ };
}

function requiresAuthentication(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const tokenType = authHeader && authHeader.split(" ")[0];

  //if token is present verify
  if (token !== null && token !== undefined) {
    if (tokenType !== "Bearer") {
      next(createHttpError(401, "Authorization header is malformed"));
      return;
    }
    jwt.verify(token, getTokenSecret(), (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          next(createHttpError(401, "JWT token has expired"));
        } else if (err.name === "JsonWebTokenError") {
          next(createHttpError(401, "Invalid JWT token"));
        } else {
          next(createHttpError(500, "Error verifying JWT token"));
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
  } else {
    next();
  }
}

function requiresStrictAuthentication(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  //if token is present verify
  if (token !== null && token !== undefined) {
    requiresAuthentication(req, res, next);
  } else {
    next(
      createHttpError(401, "Authorization header ('Bearer token') not found")
    );
  }
}

module.exports = {
  createTokenPayload,
  requiresAuthentication,
  requiresStrictAuthentication,
};
