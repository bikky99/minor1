const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const postController = require("./controllers/postController");
const followController = require("./controllers/followController");
const responseController = require("./controllers/responseController");
const voteController = require("./controllers/voteController");

// user related routes
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/gg", (req, res) => {
  res.send("gg");
});

// post related routes
router.get(
  "/create-post",
  userController.mustBeLoggedIn,
  postController.viewCreateScreen
);
router.post(
  "/create-post",
  userController.mustBeLoggedIn,
  postController.create
);
router.get(
  "/post/:id",
  responseController.postPost,
  responseController.viewResponse,
  // responseController.findUsername,
  // postController.viewSingle,
  
);
router.get(
  "/post/:id/edit",
  userController.mustBeLoggedIn,
  postController.viewEditScreen
);
router.post(
  "/post/:id/edit",
  userController.mustBeLoggedIn,
  postController.edit
);
router.post(
  "/post/:id/delete",
  userController.mustBeLoggedIn,
  postController.delete
);
router.post("/search", postController.search);

//profile related routes
router.get(
  "/profile/:username",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profilePostsScreen
);
router.get(
  "/profile/:username/followers",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowersScreen
);
router.get(
  "/profile/:username/following",
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profileFollowingScreen
);

//follow related routes
router.post(
  "/addFollow/:username",
  userController.mustBeLoggedIn,
  followController.addFollow
);

router.post(
    "/removeFollow/:username",
    userController.mustBeLoggedIn,
    followController.removeFollow
);

//answer related routes
router.post(
  "/:questionId/answer",
  userController.mustBeLoggedIn,
  responseController.answer
);


//vote related routes
router.post(
  "/addVote/:question",
  userController.mustBeLoggedIn,
  voteController.vote
);

router.post(
  "/voteAnswer/:answer",
  userController.mustBeLoggedIn,
  voteController.voteAnswer
)


//trending related routes
router.get("/trending", postController.trending);
module.exports = router;
