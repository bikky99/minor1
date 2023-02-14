const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const flash = require("connect-flash");
// const markdown = require("marked");
// const csrf = require("csurf");
const app = express();
// const sanitizeHTML = require("sanitize-html");

app.use(express.urlencoded({ extended: false })); //add user submitted data to req.body
app.use(express.json());

// let sessionOptions = session({
//   secret: "JavaScript is so cool",
//   store: new MongoStore({ client: require("./db") }),
//   resave: false,
//   saveUninitialized: false,
//   cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
// });

// app.use(sessionOptions);

// app.use("/api", require("./router-api"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      db: require("./db"),
      url: "mongodb://127.0.0.1:27017/minor",
    }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    },
  })
);

app.use(flash());

// app.use(function (req, res, next) {
//   // make our markdown function available from within ejs templates
//   res.locals.filterUserHTML = function (content) {
//     return sanitizeHTML(markdown.parse(content), {
//       allowedTags: [
//         "p",
//         "br",
//         "ul",
//         "ol",
//         "li",
//         "strong",
//         "bold",
//         "i",
//         "em",
//         "h1",
//         "h2",
//         "h3",
//         "h4",
//         "h5",
//         "h6",
//       ],
//       allowedAttributes: {},
//     });
//   };

  // make all error and success flash messages available from all templates
//   res.locals.errors = req.flash("errors");
//   res.locals.success = req.flash("success");

 // make current user id available on the req object
//   if (req.session.user) {
//     req.visitorId = req.session.user._id;
//   } else {
//     req.visitorId = 0;
//   }

//  // make user session data available from within view templates
//   res.locals.user = req.session.user;
//   next();
// });

// app.use(csrf());

// app.use(function (req, res, next) {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });

app.use(function (req, res, next) {
  //make all error and success flash messages available from all templates
  res.locals.success = req.flash("success");
  res.locals.errors = req.flash("errors");

  // make user session data available from within view templates


  // make current user id available on the req object
  if (req.session.user) {
    req.visitorId = req.session.user._id;
  } else {
    req.visitorId = 0;
  }



  // make all error and success flash messages available from all templates
  res.locals.user = req.session.user;
  next();
});

const router = require("./router");

app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.use("/", router);

// app.use(function (err, req, res, next) {
//   if (err) {
//     if (err.code == "EBADCSRFTOKEN") {
//       req.flash("errors", "Cross site request forgery detected.");
//       req.session.save(() => res.redirect("/"));
//     } else {
//       res.render("404");
//     }
//   }
// });

module.exports = app;

// const server = require("http").createServer(app);

// const io = require("socket.io")(server);

// io.use(function (socket, next) {
//   sessionOptions(socket.request, socket.request.res, next);
// });

// io.on("connection", function (socket) {
//   if (socket.request.session.user) {
//     // user is logged in
//     let user = socket.request.session.user;

//     socket.emit("welcome", { username: user.username, avatar: user.avatar });

//     socket.on("chatMessageFromBrowser", function (data) {
//       socket.broadcast.emit("chatMessageFromServer", {
//         message: sanitizeHTML(data.message, {
//           allowedTags: [],
//           allowedAttributes: {},
//         }),
//         username: user.username,
//         avatar: user.avatar,
//       });
//     });
//   }
// });

// module.exports = server;
