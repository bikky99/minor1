const Response = require("../models/Response");

exports.answer = function (req, res) {
  let response = new Response(req.body, req.session.user._id, req.params.questionId);
  response
    .answer()
    .then(function (newId) {
      req.flash("success", "New Response successfully Added.");
      req.session.save(function () {
        res.redirect(`/`);
      });
    })
    .catch(function (errors) {
      errors.forEach(function (error) {
        req.flash("errors", error);
      });
      req.session.save(function () {
        res.redirect("/");
      });
    });
};


exports.viewResponse = async function (req, res) {
  let answers = await Response.findAllById(req.params.id, req.visitorId);
  res.render("single-post-screen", { answers: answers });
};

// exports.viewResponse = async function (req, res) {
//   try {
//     let answer = await Response.getAnswers(req.params.id, req.visitorId);
//     res.render("single-post-screen", { answer: answer,
//      });
//     // let response = await Post.findAnswerById(req.params.id, req.visitorId);
//     // res.render("single-post-screen", {
//     //   response: response
//     //  });
      
//   } catch {
//     res.render("404");
//   }
// }


exports.home = async function (req, res) {
  if (req.session.user) {
    // fetch feed of posts for current user
    let posts = await Post.getFeed(req.session.user._id);
    res.render("home-dashboard", {
      posts: posts,
      username: req.session.user.username,
      avatar: req.session.user.avatar,
    });
  } else {
    res.render("home-guest", { regErrors: req.flash("regErrors") });
  }
};