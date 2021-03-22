var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
const config = require('./src/config/global.js');
firebase.initializeApp(config.firebaseConfig);
const express = require("express");
const bodyParser = require('body-parser');
const util = require('./src/services/util.js'); // custom library
const ejs = require('ejs');
const e = require('express');
const app = express();
app.use("/:userId", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json({ limit: '1mb' }));
const LAYOUT_DIR = __dirname + "/src/layouts/";

/* ------------------- DECLARATIONS ---------------------- */
var userUid = null;


/* ------------------- ROUTES ---------------------- */
app.get("/:userId/find-matches", function (req, res) {

  if (req.params.userId == userUid) {
    var item = {
      name: "Gabbie",
      bio: "good girl very naughty",
      image: "ic_dummy_pet.png",
      profileUrl: "abcdefghijkKey"
    };
    var items = [item, item, item, item, item];
    res.render("find_matches", { list: items });
    console.log(req.body);
  }
  else {
    res.send("You have no access!");
  }

});


// home page
app.get("/home", function (req, res) {
  if (!isUserLoggedIn(res)) {
    res.sendFile(LAYOUT_DIR + "/home.html");
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
  if (!isUserLoggedIn(res)) {
    res.send("about us");
  }
});

// team
app.get("/team", function (req, res) {
  if (!isUserLoggedIn(res)) {
    res.send("team page");
  }
});

// login
app.get("/login", function (req, res) {
  if (!isUserLoggedIn(res)) {
    res.sendFile(LAYOUT_DIR + "/login.html");
  }
});

// sign-up
app.get("/sign-up", function (req, res) {
  if (!isUserLoggedIn(res)) {
    res.sendFile(LAYOUT_DIR + "/sign_up.html");
  }
});

app.get("/:userId/view-profile/:targetUrl", function (req, res) {
  //res.render();
  res.send("TODO: " + req.params.targetUrl);
});



/* ------------------- POST METHODS ---------------------- */
app.post("/contact", function (req, res) {
  var contactUsInfo = {
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    email: req.body.email,
    regarding: req.body.regarding,
    message: req.body.message
  };

  util.sendEmail(contactUsInfo);
  res.redirect("/contact");
});

// find-matches-like-pet
app.post('/api', function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  // return response to client
  res.json({
    status: "success",
    index: req.body.index
  });
})

// user-registration
app.post('/service-user-registration', function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  registerUser(req.body, res);

})

// user-login
app.post('/service-user-login', function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  signInUser(req.body, res);

})



/**
 * 
 * @returns user object. If null, then user is not logged in
 */
function isUserLoggedIn(serverResponse) {
  var user = firebase.auth().currentUser;
  if (user != null) {
    console.log("user already logged in. Redirecting to private page...");
    res.redirect("/" + user.uid + "/find-matches");
    return true;
  }
  return false;
}
/**
 * 
 * @param {*} loginInfo an object containing user's email and pass
 * @param {*} serverResponse the response object from the server. This is will be used from this method to return the reply
 */
function signInUser(loginInfo, serverResponse) {
  firebase.auth().signInWithEmailAndPassword(loginInfo.email, loginInfo.password)
    .then((userCredential) => {
      console.log("logged in successfully");
      userUid = userCredential.user.uid;
      // send response back
      serverResponse.json({
        status: 1,
        uid: userUid
      });
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log("error: " + error.message);
      serverResponse.json({
        status: -1,
        uid: null,
        message: error.message
      });
    });
}

/**
 * 
 * @param {*} user object containing user's signup informatin
 * @param {*} serverResponse the response object from the server. This is will be used from this method to return the reply
 */
function registerUser(user, serverResponse) {
  firebase.auth().createUserWithEmailAndPassword(user.email, user.password)
    .then((res) => {
      var uid = null;
      if (res.user != null) {
        if (!res.additionalUserInfo.isNewUser) {
          console.log("user email exists!");
          serverResponse.json({
            status: -1,
            uid: null,
            message: "Your email already exists"

          });
        } else {
          uid = res.user.uid;
          firebase.database().ref('users/' + uid).set({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            country: user.country
          }).then(res => {
            console.log("registration successful!");
            userUid = uid;
            serverResponse.json({
              status: 1,
              uid: uid,
              message: null
            });
          });

        }
      }
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log("registration failed: " + error.message);
      serverResponse.json({
        status: -2,
        uid: null,
        message: error.message
      });
    });
}


/* var starCountRef = firebase.database().ref();
starCountRef.once('value', (snapshot) => {
  const data = snapshot.val();
  console.log(data);
});
 */

/* ------------------- ENTRY POINT: PORT 3000 ---------------------- */
app.listen(3000, function () {
  console.log("server started");
});