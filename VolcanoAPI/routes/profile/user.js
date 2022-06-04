var express = require("express");
const createHttpError = require("http-errors");
const {
  requiresLaxAuthentication,
  requiresStrictAuthentication,
} = require("../../helpers/accesstoken");
const dateValidator = require("../../helpers/dateValidator");
var router = express.Router();

/* GET user profile route. */
router.get(
  "/:Email/profile",
  requiresLaxAuthentication,
  function (req, res, next) {
    const email = req.params.Email;
    const columns = ["email", "firstName", "lastName"];

    // If user is authenticated and looking up themselves then provide extra information
    if (req.user !== undefined && req.user.email === email) {
      columns.push("dob", "address");
    }

    const queryUsers = req.db
      .select(columns)
      .from("users")
      .where("email", "=", email);
    queryUsers
      .then((users) => {
        if (users.length > 0) {
          var user = users[0];
          user.dob = dateValidator.formatDate(user.dob);
          res.status(200).json(users[0]);
        } else {
          next(createHttpError(404, "User not found"));
        }
      })
      .catch((err) => {
        console.log(err.message);
        next(createHttpError(500, "Error retrieving user"));
      });
  }
);

/* PUT user profile route. */
router.put(
  "/:Email/profile",
  requiresStrictAuthentication,
  function (req, res, next) {
    const email = req.params.Email;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const dob = req.body.dob;
    const address = req.body.address;

    if (req.user.email !== email) {
      next(createHttpError(403, "Forbidden"));
      return;
    }

    if (!firstName || !lastName || !dob || !address) {
      next(
        createHttpError(
          400,
          "Request body incomplete: firstName, lastName, dob and address are required."
        )
      );
      return;
    }

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof address !== "string"
    ) {
      next(
        createHttpError(
          400,
          "Request body invalid: firstName, lastName and address must be strings only."
        )
      );
      return;
    }

    if (!dateValidator.isValid(dob)) {
      next(
        createHttpError(
          400,
          "Invalid input: dob must be a real date in format YYYY-MM-DD."
        )
      );
      return;
    }

    if (Date.now() <= new Date(dob).getTime()) {
      next(
        createHttpError(400, "Invalid input: dob must be a date in the past.")
      );
      return;
    }

    const queryUsers = req.db;
    queryUsers
      .from("users")
      .where("email", "=", email)
      .update({
        firstName: firstName,
        lastName: lastName,
        dob: dob,
        address: address,
      })
      .then((success) => {
        if (success) {
          const columns = ["email", "firstName", "lastName", "dob", "address"];
          queryUsers
            .select(columns)
            .from("users")
            .where("email", "=", email)
            .then((users) => {
              if (users.length > 0) {
                const updatedUser = users[0];
                updatedUser.dob = dateValidator.formatDate(updatedUser.dob);
                res.status(200).json(updatedUser);
              } else {
                next(createHttpError(404, "User not found"));
              }
            });
        } else {
          throw new Error("Error updating user");
        }
      })
      .catch((err) => {
        console.log(err.message);
        next(createHttpError(500, "Error updating user"));
      });
  }
);

module.exports = router;
