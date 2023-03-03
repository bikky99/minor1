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

// Response.reuseablePostQuery = function (
//   uniqueOperations,
//   visitorId,
//   finalOperations = []
// ) {
//   return new Promise(async function (resolve, reject) {
//     let aggOperations = uniqueOperations
//       .concat([
//         {
//           $lookup: {
//             from: "users",
//             localField: "author",
//             foreignField: "_id",
//             as: "authorDocument",
//           },
//         },
//         {
//           $project: {
//             title: 1,
//             body: 1,
//             createdDate: 1,
//             star: 1,
//             weight: 1,
//             authorId: "$author",
//             author: { $arrayElemAt: ["$authorDocument", 0] },
//           },
//         },
//       ])
//       .concat(finalOperations);

//     let posts = await postsCollection.aggregate(aggOperations).toArray();

//     // clean up author property in each post object
//     posts = posts.map(function (post) {
//       post.isVisitorOwner = post.authorId.equals(visitorId);
//       post.authorId = undefined;
//       post.author = {
//         username: post.author.username,
//         avatar: new User(post.author, true).avatar,
//       };
//       return post;
//     });

//     resolve(posts);
//   });
// };

// Response.findAllById = function (id, visitorId) {
//   return new Promise(async function (resolve, reject) {
//     if (typeof id != "string" || !ObjectId.isValid(id)) {
//       reject();
//       return;
//     }

//     let answers = await Response.reuseablePostQuery(
//       [{ $match: { _id: new ObjectId(id) } }],
//       visitorId
//     );
//     if (answers.length) {
//       answers = answers[0];
//       console.log(answers);
//       // posts.isVisitorOwner = posts.author.equals(visitorId);
//       answers.star = posts.star ? post.star : 0;
//       resolve(answers);
//     } else {
//       reject();
//     }
//   });
// };



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




