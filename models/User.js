const validator = require("validator");
const bcrypt = require("bcryptjs");
const md5 = require("md5");
const userCollection = require("../db").db().collection("users");

let User = function (data, getAvatar) {
  this.data = data;
  this.errors = [];

  if (getAvatar == undefined) {
    getAvatar = false;
  }
  if (getAvatar) {
    this.getAvatar();
  }
};

User.prototype.cleanUp = function () {
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data.password != "string") {
    this.data.password = "";
  }
  //get rid of any bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};

User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    if (this.data.username == "") {
      this.errors.push("You must provide a username.");
    }
    if (validator.isAlphanumeric(this.data.username) == false) {
      this.errors.push("Username can only contain letters and numbers.");
    }
    if (this.data.username.length > 0 && this.data.username.length < 3) {
      this.errors.push("Username must be at least 3 characters.");
    }
    if (this.data.username.length > 30) {
      this.errors.push("Username cannot exceed 30 characters.");
    }
    if (validator.isEmail(this.data.email) == false) {
      this.errors.push("You must provide a valid email.");
    }
    if (this.data.password == "") {
      this.errors.push("You must provide a password.");
    }
    if (this.data.password.length > 0 && this.data.password.length < 5) {
      this.errors.push("Password must be at least 5 characters.");
    }
    if (this.data.password.length > 50) {
      this.errors.push("Password cannot exceed 50 characters.");
    }
    //only if username is valid then check to see if it's already taken
    if (
      this.data.username.length > 2 &&
      this.data.username.length < 31 &&
      validator.isAlphanumeric(this.data.username)
    ) {
      let usernameExists = await userCollection.findOne({
        username: this.data.username,
      });
      if (usernameExists) {
        this.errors.push("That username is already taken.");
      }
    }
    //only if email is valid then check to see if it's already taken
    if (validator.isEmail(this.data.email)) {
      let emailExists = await userCollection.findOne({
        email: this.data.email,
      });
      if (emailExists) {
        this.errors.push("That email is already being used.");
      }
    }
    resolve();
  });
};

User.prototype.login = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    userCollection
      .findOne({ username: this.data.username })
      .then((attemptedUser) => {
        if (
          attemptedUser &&
          bcrypt.compareSync(this.data.password, attemptedUser.password)
        ) {
            this.data = attemptedUser;
            this.getAvatar();
          resolve("Congrats");
        } else {
          reject("Invalid username / password");
        }
      })
      .catch(function () {
        reject("Please try again later");
      });
  });
};

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate();

    if (!this.errors.length) {
      //save user data into a database
      //hash user password
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      await userCollection.insertOne(this.data);
      this
        this.getAvatar();
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

User.prototype.getAvatar = function () {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
};

User.findByUsername = function (username) {
  return new Promise(function (resolve, reject) {
    if (typeof username != "string") {
      reject();
      return;
    }
    userCollection.findOne({ username: username }).then(function (userDoc) {
      if (userDoc) {
        userDoc = new User(userDoc, true);
        userDoc = {
          _id: userDoc.data._id,
          username: userDoc.data.username,
          avatar: userDoc.avatar,
        };
        resolve(userDoc);
      } else {
        reject();
      }
    }).catch(function () {
      reject();
    });
  });
};

module.exports = User;

// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const userSchema = new Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   password: {
//     type: String,
//     required: true,
//   },
//   is_verified: {
//     type: Boolean,
//     default: false,
//     },
// });

// userSchema.methods.validate = function () {
//   if(this.data.username == ''){
//     this.errors.push('You must provide a username.');
//   }
// }

// userSchema.methods.register = function () {

//     //step 1: validate user data
//     this.validate(data);

//     //step 2: only if there are no validation errors then save the user data into a database
// }

// const User = mongoose.model('User', userSchema);

// module.exports = User;
