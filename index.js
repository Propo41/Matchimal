var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
const config = require("./src/config/global.js");
firebase.initializeApp(config.firebaseConfig);
const express = require("express");
const bodyParser = require("body-parser");
const util = require("./src/services/util.js"); // custom library
const ejs = require("ejs");
const app = express();
//To use multiple static assets directories,
// call the express.static middleware function multiple times:
app.use("/:userId", express.static("public"));
app.use("/:userId/:targetUrl", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.json({ limit: "1mb" }));

/* ------------------- DECLARATIONS ---------------------- */
var userUid = null;
const LAYOUT_DIR = __dirname + "/src/layouts/";
const ERROR_ACCESS_DENIED = "ACCESS DENIED! SESSION EXPIRED";

/* ------------------- ROUTES ---------------------- */
// home page
app.get("/start", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.sendFile(LAYOUT_DIR + "/start.html");
  }
});

// contact
app.get("/contact", function (req, res) {
  if (!isUserLoggedIn(res)) {
    res.sendFile(LAYOUT_DIR + "/contact.html");
  }
});

// about us
app.get("/about-us", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.send("about us");
  }
});

// team
app.get("/team", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.send("team page");
  }
});

// login
app.get("/login", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    /*   res.sendFile(LAYOUT_DIR + "/login.html"); */
    res.render("login", {
      script: "login.js",
      style: "login_style.css",
    });
  }
});

// sign-up
app.get("/sign-up", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.render("sign_up", {
      script: "sign_up.js",
      style: "login_style.css",
    });
  }
});

// private: view pet profile
app.get("/:userId/view-profile/:targetUrl", function (req, res) {
  util.fetchPetProfile(req.params.targetUrl).then((pet) => {
    res.render("pet_profile", {
      script: "pet_profile.js",
      style: "pet_profile_style.css",
      pet: pet,
      userUid: userUid,
    });
  });
});

// private: edit profile
app.get("/:userId/edit-profile", function (req, res) {
  if (req.params.userId == userUid) {
    //res.sendFile(LAYOUT_DIR + "/add_pet.html");
    res.render("edit_profile", {
      script: "edit_profile.js",
      style: "edit_profile.css",
      userUid: userUid,
    });
  } else {
    res.send(ERROR_ACCESS_DENIED);
  }
});

// private: find matches
app.get("/:userId/find-matches", function (req, res) {
  if (req.params.userId == userUid) {
    util
      .fetchPetsAvailable(userUid)
      .then((result) => {
        res.render("find_matches", {
          script: "find_matches.js",
          list: result.availablePets,
          userUid: userUid,
          usersLikedPetKeysIndex: result.usersLikedPetKeysIndex,
          style: "private_style.css",
        });
        console.log(req.body);
      })
      .catch((e) => {
        console.error("error: " + e.message);
      });
  } else {
    res.send(ERROR_ACCESS_DENIED);
  }
});

// private: view my likes
app.get("/:userId/my-likes", function (req, res) {
  if (req.params.userId == userUid) {
    var myLikes = [];
    util.fetchMyLikes(userUid).then((list) => {
      myLikes = list;
      if (myLikes.length != 0) {
        res.render("my_likes", {
          script: "my_likes.js",
          list: myLikes,
          userUid: userUid,
          style: "edit_profile.css",
        });
      } else {
        res.render("placeholder_no_likes", {
          script: "placeholder_no_likes.js",
          list: myLikes,
          userUid: userUid,
          style: "my_likes_nofav.css",
        });
      }
    });
  } else {
    res.send("You have no access!");
  }
});

// log out user
app.get("/log-out", function (req, res) {
  firebase
    .auth()
    .signOut()
    .then(() => {
      userUid = null;
      // redirect user to start page
      console.log("logging out user...redirecting");
      res.redirect("/start");
    })
    .catch((error) => {});
});

/* ------------------- POST METHODS ---------------------- */

app.post("/contact", function (req, res) {
  var contactUsInfo = {
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    email: req.body.email,
    regarding: req.body.regarding,
    message: req.body.message,
  };

  util.sendEmail(contactUsInfo);
  res.redirect("/contact");
});

// private: find-matches-like-pet
app.post("/service-matches-likes", function (req, res) {
  console.log("receiving data from client: ");
  var availablePets = [];
  var availablePetsKeys = [];
  util
    .fetchPetsAvailable(userUid)
    .then((result) => {
      availablePets = result.availablePets;
      availablePetsKeys = result.availablePetsKeys;
      // return response to client
      util
        .toggleLikePet(
          availablePetsKeys[req.body.index],
          userUid,
          availablePets[req.body.index]
        )
        .then((status) => {
          console.log("promise returned: ");
          console.log(status);
          res.json({ status: status, index: req.body.index });
        });
    })
    .catch((e) => {
      console.error("error at fetchPetsAvailable: " + e.message);
    });
});

// private: view pet profile
app.post("/service-matches-profile-click", function (req, res) {
  console.log("receiving data from client: ");
  var availablePetsKeys = [];
  util
    .fetchPetsAvailable(userUid)
    .then((result) => {
      availablePetsKeys = result.availablePetsKeys;
      // return response to client
      res.json({
        url: `/${userUid}/view-profile/${availablePetsKeys[req.body.index]}`,
      });
    })
    .catch((e) => {
      console.error("error at fetchPetsAvailable: " + e.message);
    });
});

// user-registration
app.post("/service-user-registration", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util.registerUser(req.body, res).then((reply) => {
    userUid = reply.uid;
    res.json(reply);
  });
});

// private: edit profile -> about me
app.post("/service-edit-profile-about-me", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util.getUserInfo(userUid).then((user) => {
    console.log("user info: ");
    console.log(user);
    res.json(user);
  });
});

// private: edit profile -> about me: update button pressed
app.post("/service-edit-profile-about-me-update", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util
    .updateUserInfo(userUid, req.body.newData)
    .then(() => {
      res.json({ status: "success" });
    })
    .catch(() => {
      res.json({ status: "failure" });
    });
});

// user-login
app.post("/service-user-login", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util.signInUser(req.body, res).then((reply) => {
    userUid = reply.uid;
    res.json(reply);
  });
});

app.post("/service-user-add-pet", function (req, res) {
  console.log(req.body);
  util.addPet(req.body, userUid).then((status) => {
    res.json(status);
  });
});

/* ------------------- ENTRY POINT: PORT 3000 ---------------------- */
app.listen(3000, function () {
  console.log("server started");
});
