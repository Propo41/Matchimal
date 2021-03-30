var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");
require("firebase/storage");
const config = require("./src/config/global.js");
firebase.initializeApp(config.firebaseConfig);
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const util = require("./src/services/util.js"); // custom library
const ejs = require("ejs");
var Multer = require("multer");
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // no larger than 5mb, you can change as needed.
  },
});

//To use multiple static assets directories,
// call the express.static middleware function multiple times:
app.use("/", express.static("public"));
app.use("/:userId", express.static("public"));
app.use("/:userId/:targetUrl", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.json({ limit: "20mb" }));

/* ------------------- DECLARATIONS ---------------------- */
var userUid = null;
/* ------------------- ROUTES ---------------------- */
// home page
app.get("/", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.render("home", {
      script: "home.js",
      style: "home_style.css",
    });
    //util.addTeamInfo();
  }
});

// contact
app.get("/contact", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.render("contact", {
      script: "contact.js",
      style: "contact_style.css",
    });
  }
});

// about us
app.get("/about-us", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.render("about_us", {
      style: "about_us_style.css",
      script: "about_us.js",
    });
  }
});

// team
app.get("/team", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    // get team info from database
    util.getTeamInfo().then((team) => {
      /*   console.log("team: ");
      console.log(team); */
      res.render("team_page", {
        script: "team_page.js",
        style: "team_page_style.css",
        team: team,
      });
    });
  }
});

// login
app.get("/login", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    /*   res.sendFile(LAYOUT_DIR + "/login.html"); */
    res.render("login", {
      script: "login.js",
      style: "login_signup_style.css",
    });
  }
});

// sign-up
app.get("/sign-up", function (req, res) {
  if (!util.isUserLoggedIn(res)) {
    res.render("sign_up", {
      script: "sign_up.js",
      style: "login_signup_style.css",
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
    res.render("session_expired");
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
          style: "find_matches_style.css",
        });
        console.log(req.body);
      })
      .catch((e) => {
        console.error("error: " + e.message);
      });
  } else {
    res.render("session_expired");
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
          style: "my_likes_nofav.css",
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
    res.render("session_expired");
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
      res.redirect("/");
    })
    .catch((error) => {});
});

// admin-LOGIN
app.get("/admin-login", function (req, res) {
  res.render("admin_login", {
    script: "admin_login.js",
    style: "admin_login.css",
  });
});

// admin-LOGIN
app.get("/admin/home", function (req, res) {
  util
    .getStatsForAdmin()
    .then((stats) => {
      res.render("admin_home", {
        script: "admin_home.js",
        style: "admin_home.css",
        stats: stats,
      });
    })
    .catch((e) => {
      console.log(e.message);
    });
});

// admin-users
app.get("/admin/users", function (req, res) {
  util
    .getUsersList()
    .then((users) => {
      res.render("admin_users", {
        script: "admin_users.js",
        style: "admin_user_pet_style.css",
        users: users,
      });
    })
    .catch((e) => {
      console.error(e);
    });
});

// admin-PETS
app.get("/admin/pets", function (req, res) {
  util
    .getPetsList()
    .then((pets) => {
      res.render("admin_pets", {
        script: "admin_pets.js",
        style: "admin_user_pet_style.css",
        pets: pets,
      });
    })
    .catch((e) => {
      console.log(e);
    });
});

// admin-team
app.get("/admin/team-member/:number", function (req, res) {
  util
    .getMemberInfo(req.params.number)
    .then((member) => {
      res.render("admin_team", {
        script: "admin_team.js",
        style: "admin_team_style.css",
        member: member,
        number: req.params.number,
      });
    })
    .catch((e) => {
      console.log(e);
    });
});

// private: view pet profile
app.get("/admin/pets/:targetUrl", function (req, res) {
  util.fetchPetProfile(req.params.targetUrl).then((pet) => {
    res.render("pet_profile", {
      script: "pet_profile.js",
      style: "pet_profile_style.css",
      pet: pet,
      userUid: userUid,
    });
  });
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

  util
    .sendEmail(contactUsInfo)
    .then(() => {
      res.redirect("/contact");
    })
    .catch((e) => {
      console.log(e.message);
    });
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
  util
    .signInUser(req.body, res)
    .then((reply) => {
      userUid = reply.uid;
      res.json(reply);
    })
    .catch((e) => {
      res.json({
        status: -1,
        message: e.message,
      });
    });
});

app.post("/profile", multer.single("avatar"), function (req, res, next) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  if (req.file) {
    console.log(req.body);
    console.log(req.file);

    util
      .uploadImageToStorage(req.file, "1234")
      .then((success) => {
        console.log(success);
        res.status(200).send({
          status: "success",
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }
});

app.post("/service-user-add-pet", multer.single("avatar"), function (req, res) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  console.log("Add pet: receiving data from client: ");
  var pet = {
    petName: req.body.petName,
    primaryBreed: req.body.primaryBreed,
    bio: req.body.bio,
    birthDate: req.body.birthDate,
    ownerUid: userUid,
    recentDiagnosedDisease: req.body.recentDiagnosedDisease,
    vaccinationDate: req.body.vaccinationDate,
    gender: req.body.gender,
  };
  util
    .addPet(pet, req.file)
    .then((status) => {
      console.log("pet created successfully.");
      res.json(status);
    })
    .catch((e) => {
      console.log(e.message);
    });
});

app.post("/service-edit-profile-my-pets", function (req, res) {
  console.log("My pets: receiving data from client: ");
  console.log(req.body);
  util
    .getMyPets(userUid)
    .then((pets) => {
      res.json(pets);
    })
    .catch((e) => {
      console.log(e.message);
      res.json({ status: "failure" });
    });
});

app.post("/service-user-delete-pet", function (req, res) {
  console.log("My pets-delete: receiving data from client: ");
  util
    .deletePet(req.body.key, userUid)
    .then(() => {
      res.json({ status: "success" });
    })
    .catch((e) => {
      res.json({ status: "failure" });
      console.log(e.message);
    });
});

// ADMIN: admin-login
app.post("/service-admin-login", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util
    .signInAdmin(req.body, res)
    .then((reply) => {
      if (reply.id == req.body.id && reply.pin == req.body.pin) {
        console.log("matched!");
        // admin sign in
        userUid = reply.id;
        res.json({ status: 1, message: "Matched" });
      } else {
        console.log("incorrect!");

        res.json({ status: -1, message: "Incorrect input provided." });
      }
    })
    .catch((e) => {
      res.json({ status: -2, message: "error fetching info" });
    });
});

// ADMIN: delete user
app.post("/service-admin-delete-user", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util
    .deleteUser(req.body.key)
    .then((status) => {
      res.json({ status: status });
    })
    .catch((e) => {
      console.log(e.message);
      res.json({ status: "failure" });
    });
});

// ADMIN: delete pet
app.post("/service-admin-delete-pet", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util
    .deletePet(req.body.pet, req.body.owner)
    .then((status) => {
      if (status) {
        res.json({ status: "success" });
      }
    })
    .catch((e) => {
      console.log(e.message);
      res.json({ status: "failure" });
    });
});

// ADMIN: update member
app.post("/service-admin-update-member", function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  util
    .updateMemberInfo(req.body.member, req.body.number)
    .then((status) => {
      res.json(status);
    })
    .catch((e) => {
      console.log(e.message);
      res.json({ status: "failure" });
    });
});

/* ------------------- ENTRY POINT: PORT 3000 ---------------------- */
app.listen(3000, function () {
  console.log("server started");
});
