const postsCollection = require("../db").db().collection("posts");
const followsCollection = require("../db").db().collection("follows");
const ObjectId = require("mongodb").ObjectId;
const User = require("./User");
const responseCollection = require("../db").db().collection("response");

let Response = function (data, userId, questionId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
  this.questionId = questionId; 
//   this.postId = req.params.id;
};

Response.prototype.cleanUp = function () {
  if (typeof this.data.body != "string") {
    this.data.body = "";
  }
  // get rid of any bogus properties
  this.data = {
    body: this.data.body.trim(),
    createdDate: new Date(),
    star: 0,
    author: ObjectId(this.userId),
    question: ObjectId(this.questionId),
    // post: ObjectId(this.postId),
  };
};

Response.prototype.validate = function () {
  return new Promise((resolve, reject) => {
    if (this.data.body == "") {
      this.errors.push("You must provide post content.");
    }
    resolve();
  });
};

Response.findAllById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id!= "string" ||!ObjectId.isValid(id)) {
      reject();
      return;
    }
    let responses = await postsCollection.aggregate([
      { $match: { _id: new ObjectId(id) }},
      { $lookup: { from: "response", localField: "_id", foreignField: "question", as: "response"}},
      // { $unwind: "$response" },
      { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author"}},
      // { $unwind: "$author" },

      { $project: {
        _id: 1,
        body: 1,
        createdDate: 1,
        star: 1,
        vote:1,
        title:1,
        weight: 1,
        author: { $arrayElemAt: ["$author", 0] },
        response: 1 
      }}

    ]).toArray();
    // clean up author property in each post object

    responses = responses.map(function (response) {
      response.author = {
        username: response.author.username,
        avatar: new User(response.author, true).avatar,
      };
      return response;
    });

    if (responses.length ) {
      // console.log(responses[0]); 
      responses =responses[0]
      resolve(responses); 
    } else {
      reject();
    }
  });
}

Response.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != "string" || !ObjectId.isValid(id)) {
      reject();
      return;
    }

    let posts = await Response.reuseablePostQuery(
      [{ $match: { _id: new ObjectId(id) } }],
      visitorId
    );
    if (posts.length) {
      posts = posts[0];
      console.log(posts);
      // posts.isVisitorOwner = posts.author.equals(visitorId);
      posts.authorId = undefined;
      posts.author = {
        username: posts.author.username,
        avatar: new User(posts.author, true).avatar,
      };
      resolve(posts);
    } else {
      reject();
    }
  });
}





Response.prototype.answer = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate().then(() => {
      if (!this.errors.length) {
        console.log(this.data);
        // save post into database
        responseCollection
          .insertOne(this.data)
          .then(() => {
            resolve();
          })
          .catch(() => {
            this.errors.push("Please try again later.");
            reject(this.errors);
          });
      } else {
        reject(this.errors);
      }
    });
  });
};



module.exports = Response;




