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

// Response.findUsername = function (id, visitorId) {
//   return new Promise(async function (resolve, reject) {
//     if (typeof id!= "string" ||!ObjectId.isValid(id)) {
//       reject();
//       return;
//     }
//     let responses = await postsCollection.aggregate([
//       // { $match: { _id: new ObjectId(id) }},
//       // { $lookup: { from: "response", localField: "_id", foreignField: "question", as: "response"}},
//       // { $unwind: "$response" },
//       // { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author"}},
//       // { $unwind: "$author" },
//       { $match: { "response.author": new ObjectId(visitorId) } },
//       { $lookup: { from: "users", localField: "response.author", foreignField: "_id", as: "response_author"}},
      
//       { $project: {
//         _id: 1,
//         body: 1,
//         createdDate: 1,
//         star: 1,
//         vote: 1,
//         title: 1,
//         weight: 1,
//         author: { $arrayElemAt: ["$author", 0] },
//         response: 1,
//         response_author: 1,
//       }}

//     ]).toArray();
//     // clean up author property in each post object

//     responses = responses.map(function (response) {
//       response.author = {
//         username: response.author.username,
//         avatar: new User(response.author, true).avatar,
//       };
//       return response;
//     });

//     if (responses.length ) {
//       // console.log(responses[0]); 
//       responses =responses[0]

//       resolve(responses); 
//     } else {
//       reject();
//     }
//   });
// }

// Response.findAllById = function (id, visitorId) {
//   return new Promise(async function (resolve, reject) {
//     if (typeof id!= "string" ||!ObjectId.isValid(id)) {
//       reject();
//       return;
//     }
//     let responses = await postsCollection.aggregate([
//       { $match: { _id: new ObjectId(id) }},
//       { $lookup: { from: "response", localField: "_id", foreignField: "question", as: "response"}},
//       { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author"}},
//       { $lookup: { from: "users", localField: "response.author", foreignField: "_id", as: "response_author"}},
//       { $project: {
//         _id: 1,
//         body: 1,
//         createdDate: 1,
//         star: 1,
//         vote: 1,
//         title: 1,
//         weight: 1,
//         author: { $arrayElemAt: ["$author", 0] },
//         response: {
//           $map: {
//             input: "$response",
//             as: "r",
//             in: {
//               _id: "$$r._id",
//               body: "$$r.body",
//               createdDate: "$$r.createdDate",
//               question: "$$r.question",
//               star: "$$r.star",
//               author: "$$r.author",
//               author_username: {
//                 $let: {
//                   vars: {
//                     response_author: { $arrayElemAt: ["$response_author", { $indexOfArray: ["$response._id", "$$r._id"] }] }
//                   },
//                   in: "$$response_author.username"
//                 }
//               }
//             }
//           }
//         }
//       }}
//     ]).toArray();

//     // clean up author property in each post object
//     responses = responses.map(function (response) {
//       response.author = {
//         username: response.author.username,
//         avatar: new User(response.author, true).avatar,
//       };
//       return response;
//     });

//     if (responses.length) {
//       responses = responses[0];
//       resolve(responses); 
//     } else {
//       reject();
//     }
//   });
// }

Response.findAllById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id!= "string" ||!ObjectId.isValid(id)) {
      reject();
      return;
    }
    let responses = await postsCollection.aggregate([
      { $match: { _id: new ObjectId(id) }},
      { $lookup: { from: "response", localField: "_id", foreignField: "question", as: "response"}},
      { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author"}},
      { $lookup: { from: "users", localField: "response.author", foreignField: "_id", as: "response_author"}},
      { $project: {
        _id: 1,
        body: 1,
        createdDate: 1,
        star: 1,
        vote: 1,
        title: 1,
        weight: 1,
        author: { $arrayElemAt: ["$author", 0] },
        response: {
          $map: {
            input: "$response",
            as: "r",
            in: {
              _id: "$$r._id",
              body: "$$r.body",
              createdDate: "$$r.createdDate",
              question: "$$r.question",
              author: "$$r.author",
              star: "$$r.star",
              author_username: {
                $let: {
                  vars: {
                    response_author: { $arrayElemAt: ["$response_author", { $indexOfArray: ["$response.author", "$$r.author"] }] }
                  },
                  in: "$$response_author.username"
                }
              }
            }
          }
        }
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

    if (responses.length) {
      responses = responses[0];
      resolve(responses); 
    } else {
      reject();
    }
  });
}


Response.sort=(star1, star2) => {
  let results =[];
  let i =0;
  let j = 0;
  while(i < star1.length && j < star2.length){ if(star2[j] > star1[i]){
    results.push(star1[i]);
    i++;
    }else{
    results.push(star2[j])
    j++;
    }
    }
    while( i < star1.length ){
    results.push(star1[i])
    i++;
    }
    while(j < star2.length){
    results.push(star2[j])
    j++;
    }
  return results
  }
  





// Response.findAllById = function (id, visitorId) {
//   return new Promise(async function (resolve, reject) {
//     if (typeof id!= "string" ||!ObjectId.isValid(id)) {
//       reject();
//       return;
//     }
//     let responses = await postsCollection.aggregate([
//       { $match: { _id: new ObjectId(id) }},
//       { $lookup: { from: "response", localField: "_id", foreignField: "question", as: "response"}},
//       // { $unwind: "$response" },
//       { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author"}},
//       // { $unwind: "$author" },
//       // { $match: { "response.author": new ObjectId(visitorId) } },
//       { $lookup: { from: "users", localField: "response.author", foreignField: "_id", as: "response_author"}},
      
//       { $project: {
//         _id: 1,
//         body: 1,
//         createdDate: 1,
//         star: 1,
//         vote: 1,
//         title: 1,
//         weight: 1,
//         author: { $arrayElemAt: ["$author", 0] },
//         response: 1,
//         response_author: { $arrayElemAt: ["$response_author", 0]}
//       }}

//     ]).toArray();
//     // clean up author property in each post object

//     responses = responses.map(function (response) {
//       response.author = {
//         username: response.author.username,
//         avatar: new User(response.author, true).avatar,
//       };
//       return response;
//     });

//     if (responses.length ) {
//       // console.log(responses[0]); 
//       responses =responses[0]
//       resolve(responses); 
//     } else {
//       reject();
//     }
//   });
// }



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




