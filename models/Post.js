
const postsCollection = require('../db').db().collection("posts");
const followsCollection = require('../db').db().collection("follows");
const ObjectId = require('mongodb').ObjectId;
const User = require('./User');
const responseCollection = require('../db').db().collection("response");

let Post = function (data, userId, requestedPostId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
  this.requestedPostId = requestedPostId;
}

Post.prototype.cleanUp = function () {
  if (typeof(this.data.title) != "string") {this.data.title = ""}
  if (typeof(this.data.body) != "string") {this.data.body = ""}
  // get rid of any bogus properties
  this.data = {
    title: this.data.title.trim(),
    body: this.data.body.trim(),
    createdDate: new Date(),
    star: 0,
    weight: 0,
    author: ObjectId(this.userId)
  }
}

Post.prototype.validate = function () {
  return new Promise((resolve, reject) => {
    if (this.data.title == "") {this.errors.push("You must provide a title.")}
    if (this.data.body == "") {this.errors.push("You must provide post content.")}
    resolve();
  });
}

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate().then(() => {
      if (!this.errors.length) {
        // save post into database
        postsCollection.insertOne(this.data).then(() => {
          resolve();
        }).catch(() => {
          this.errors.push("Please try again later.");
          reject(this.errors);
        });
      } else {
        reject(this.errors);
      }
    });
  });
}



Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userId);
      if (post.isVisitorOwner) {
        // actually update the db
        let status = await this.actuallyUpdate();
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
}

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate().then(() => {
      if (!this.errors.length) {
        // save post into database
        postsCollection.findOneAndUpdate({_id: new ObjectId(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}}).then(() => {
          resolve("success");
        }).catch(() => {
          this.errors.push("Please try again later.");
          reject(this.errors);
        });
      } else {
        reject(this.errors);
      }
    });
  });
}

Post.reuseablePostQuery = function (uniqueOperations, visitorId, finalOperations=[]) {
  return new Promise(async function (resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      
      {$project: {
        title: 1,
        body: 1,
        createdDate: 1,
        star: 1,
        weight: 1,
        authorId: "$author",
        author: {$arrayElemAt: ["$authorDocument", 0]},
      }}
    ]).concat(finalOperations);

    let posts = await postsCollection.aggregate(aggOperations).toArray();

    // clean up author property in each post object
    posts = posts.map(function (post) {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.authorId = undefined;
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post;
    });

    resolve(posts);
  });
}

Post.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof(id) != "string" || !ObjectId.isValid(id)) {
      reject();
      return;
    }

    let posts = await Post.reuseablePostQuery([
      {$match: {_id: new ObjectId(id)}},
    ]
      , visitorId);
    if (posts.length) {
      posts = posts[0];
      // console.log(posts);
      // posts.isVisitorOwner = posts.author.equals(visitorId);
      posts.star = posts.star ? post.star : 0;
      posts.weight = posts.weight ? post.weight : 0;
      resolve(posts);
    } else {
      reject();
    }
  });
}

// Post.findAllById = function(id, visitorId) {
//   return new Promise( async function(resolve, reject) {
//     let posts = await Post.reuseablePostQuery(
//       [{ $match: { _id: new ObjectId(id) } }],
//       visitorId
//     );
//     if (posts.length) {
//       posts = posts[0];
//       console.log(posts);
//       // posts.isVisitorOwner = posts.author.equals(visitorId);
//       posts.star = posts.star ? post.star : 0;
//       posts.weight = posts.weight ? post.weight : 0;
//       resolve(posts);
//     } else {
//       reject();
//     }
//   }
// )}



// Post.findAnswerById = function (id, visitorId) {
//   return new Promise(async function (resolve, reject) {
//     let response = await responseCollection.find({question: new ObjectId(id)}).toArray();
//     resolve(response);
//     console.log(response);
//   });
// }

Post.findByAuthorId = function (authorId) {
  return Post.reuseablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ]);
}

Post.delete = function (postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({_id: new ObjectId(postIdToDelete)});
        resolve();
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
}

Post.search = function (searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) == "string") {
      let posts = await Post.reuseablePostQuery([
        {$match: {$text: {$search: searchTerm}}},
      ], null, [
        {$sort: {score: {$meta: "textScore"}}}
        ]);
      resolve(posts);
    } else {
      reject();
    }
  });
}

Post.countPostsByAuthor = function (id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({author: id});
    resolve(postCount);
  });
}

Post.getFeed = async function (id) {
  // create an array of the user ids that the current user follows
  let followedUsers = await followsCollection.find({authorId: new ObjectId(id)}).toArray();
  followedUsers = followedUsers.map(function (followDoc) {
    return followDoc.followedId;
  });

  // look for posts where the author is in the above array of followed users
  return Post.reuseablePostQuery([
    {$match: {author: {$in: followedUsers}}},
    {$sort: {createdDate: -1}}
  ]);
}



module.exports = Post;



// const mongoose = require("mongoose");

// const postSchema = new mongoose.Schema({
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     ref: "User",
//   },
//   title: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   body: {
//     type: String,
//     required: true,
//   },
//   ratings: [{
//     rating: {
//         type: Number,
//         required: true,
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now,
//     },
//   }
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     },
//   });


// // Path: models\User.js

// postSchema.methods.trending  = function () {
//     const decayFactor = 0.5;
//     const halfLife = 7;

//     function getScore(rating, createdAt){
//         const timeElapsed = (Date.now() - createdAt) / 1000*60*60*24;
//         const score = rating * Math.pow(decayFactor, timeElapsed / halfLife);
//     }

//     function getPostScore(post) {
//         let score = 0;
//         post.ratings.forEach(rating => {
//             score += getScore(rating.rating, rating.createdAt);
//         });
//         return score;
//     }
// }


// const Post = mongoose.model("Post", postSchema);

// module.exports = Post;
