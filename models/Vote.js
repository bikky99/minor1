const ObjectId = require('mongodb').ObjectId;

const postCollection = require("../db").db().collection("posts");
const userCollection = require("../db").db().collection("users");
const voteCollection = require("../db").db().collection("votes");
const responseCollection = require("../db").db().collection("response");

let Vote = function (contentId, voterId) {
  this.contentId = contentId;
  this.voterId = voterId;
  this.error = [];
};

Vote.prototype.cleanUp = function () {
  this.data = {
    content: (this.contentId),
    voter: this.voterId,
    createdDate: new Date(),
  }
}

// Vote.prototype.validate =async function() {
//     let questionId = await postCollection.findOne({_id: this.questionId});
//     let voterId = await postCollection.findOne({_id: this.voterId});

// }

Vote.prototype.save =  function() {
  this.cleanUp();
  return new Promise(async (resolve, reject) => {
    // id: new ObjectId(this.contentId)
    // await voteCollection
    // .insertOne(this.data)
    let status = await voteCollection.findOne({content: this.contentId, voter: this.voterId});
    if (status) {
      //this.errors.push("You already voted");
      resolve("You already voted");
    } else {
      await voteCollection
      .insertOne(this.data)
      await postCollection
      .updateOne(
        { _id: ObjectId(this.contentId)},
        {$push: { star: { voterId: this.voterId, date: new Date() }}}
      )
      await postCollection
      .updateOne({ _id: ObjectId(this.contentId) }, { $inc: { vote: 1 } })
      .then(() => {
        resolve('Successfully voted');
      }
      )
    }
  });
};


Vote.prototype.saveAnswerVote =  function()  {
  this.cleanUp();
  return new Promise(async(resolve, reject) => {
    console.log(this.contentId);
    let status = await voteCollection.findOne({content: this.contentId, voter: this.voterId});
    if (status) {
      //this.errors.push("You already voted");
      resolve("You already voted");
    } else {
      await voteCollection
      .insertOne(this.data)
    await responseCollection
      .updateOne({ _id: ObjectId(this.contentId) }, { $inc: { star: 1 } })
      
      .then(() => {
        resolve('Successfully voted');
      })
      .catch((err) => {
        reject(err);
      });
    }
  })
};

Vote.isVistiorVote = function (contentId, visitorId) {
  return new Promise(async (resolve, reject) => {
    let vote = await voteCollection.findOne({
      content: contentId,
      voter: visitorId,
    });
    if (vote) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
};


module.exports = Vote;
