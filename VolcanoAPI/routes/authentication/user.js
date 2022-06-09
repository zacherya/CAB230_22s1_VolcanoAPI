var express = require("express");
const createHttpError = require("http-errors");
var {
  createToken,
  createTokenPayload,
} = require("../../middleware/access-token");
const bcrypt = require("bcrypt");
var router = express.Router();

/* GET users listing. */
router.post("/register", function (req, res, next) {
  // res.send("respond with a resource non profile");

  const email = req.body.email;
  const password = req.body.password;

  // Check if request body is complete (Email and password are present)
  if (!email || !password) {
    next(
      createHttpError(
        400,
        "Request body incomplete, both email and password are required"
      )
    );
  }

  //Check if user already exists
  const queryUsers = req.db
    .from("users")
    .select("*")
    .where("email", "=", email);

  queryUsers
    .then((users) => {
      if (users.length > 0) {
        console.log(`User with email ${email} already exists`);
        next(createHttpError(400, "User already exists"));
        return;
      }
    })
    .then(() => {
      //Create user
      const saltRounds = 10;
      const hash = bcrypt.hashSync(password, saltRounds);
      return req.db
        .from("users")
        .insert({ email: email, password_hash: hash })
        .then(() => {
          console.log(`User with email ${email} created`);
          res.status(201).json({
            message: "User created",
          });
        });
    })
    .catch((err) => {
      console.log(err.message);
      next(createHttpError(500, "Error creating user"));
    });
});

router.post("/login", function (req, res, next) {
  //Decalre email and password
  const email = req.body.email;
  const password = req.body.password;

  // Check if request body is complete (Email and password are present)
  if (!email || !password) {
    next(
      createHttpError(
        400,
        "Request body incomplete, both email and password are required"
      )
    );
    return;
  }

  //Does user exist?
  const queryUsers = req.db
    .from("users")
    .select("*")
    .where("email", "=", email);

  //If does exist very passwords match
  queryUsers.then((users) => {
    if (users.length === 0) {
      console.log(`User with email ${email} does not exist`);
      next(createHttpError(401, "Incorrect email or password"));
      return;
    }

    const user = users[0];
    const passwordMatch = bcrypt.compareSync(password, user.password_hash);

    if (!passwordMatch) {
      console.log(`Password for user with email ${email} does not match`);
      next(createHttpError(401, "Incorrect email or password"));
      return;
    }

    //Create token with email as the payload
    const tokenPayload = createTokenPayload(user.email);

    //Send token to user
    res.status(200).json({
      token: tokenPayload.token,
      token_type: "Bearer",
      expires_in: tokenPayload.expires,
    });
  });
});

module.exports = router;
