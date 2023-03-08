const Vote = require("../models/Vote");

exports.vote = function (req, res) {
    console.log(req.params.question);
    // console.log(req.visitorId);
  let vote = new Vote(req.params.question, req.visitorId);

  vote.save().then((msg) => {
    req.flash('success', msg);
    req.session.save(() => res.redirect('/post/' + req.params.question));
 }).catch(() => {
   req.flash('errors', 'Sorry, you already voted.');
   });
};

exports.voteAnswer = function (req, res) {
    // console.log(req.params.answer);
    // console.log(req.visitorId);
  let vote = new Vote(req.params.answer, req.visitorId);
  // console.log(vote);

  vote.saveAnswerVote().then((msg) => {
     req.flash('success', msg);
     req.session.save(() => res.redirect('/'));
  }).catch(() => {
    req.flash('errors', 'Sorry, you already voted.');
    });
}