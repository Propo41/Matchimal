var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
const config = require('./src/config/global.js');
firebase.initializeApp(config.firebaseConfig);
const express = require("express");
const bodyParser = require('body-parser');
const util = require('./src/services/util.js'); // custom library
const ejs = require('ejs');
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.json({ limit: '1mb' }));
const LAYOUT_DIR = __dirname + "/src/layouts/";

/* ------------------- ROUTES ---------------------- */
app.get("/find-matches", function (req, res) {
  var item = {
    name: "Gabbie",
    bio: "good girl very naughty",
    image: "ic_dummy_pet.png",
    profileUrl: "abcdefghijkKey"
  };
  var items = [item, item, item, item, item];
  res.render("find_matches", { list: items });
  console.log(req.body);
});

// home page
app.get("/", function (req, res) {
  res.sendFile(LAYOUT_DIR + "/home.html");
});

// contact
app.get("/contact", function (req, res) {
  res.sendFile(LAYOUT_DIR + "/contact.html");
});

// about us
app.get("/about-us", function (req, res) {
  // res.sendFile(LAYOUT_DIR + "/contact.html");
  res.send("about us");
});

// team
app.get("/team", function (req, res) {
  // res.sendFile(LAYOUT_DIR + "/contact.html");
  res.send("team");
});

// login
app.get("/login", function (req, res) {
  // res.sendFile(LAYOUT_DIR + "/contact.html");
  res.send("login in");
});

// sign-up
app.get("/sign-up", function (req, res) {
  // res.sendFile(LAYOUT_DIR + "/contact.html");
  res.send("sign up");
});

app.get("/view-profile/:profileUrl", function (req, res) {
  //res.render();
  res.send("TODO: " + req.params.profileUrl);
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


app.post('/api', function (req, res) {
  console.log("receiving data from client: ");
  console.log(req.body);
  // return response to client
  res.json({
    status: "success",
    index: req.body.index
  });
})


var starCountRef = firebase.database().ref();
starCountRef.once('value', (snapshot) => {
  const data = snapshot.val();
  console.log(data);
});


/* ------------------- ENTRY POINT: PORT 3000 ---------------------- */
app.listen(3000, function () {
  console.log("server started");
});