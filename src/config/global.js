const nodemailer = require("nodemailer");
// BUG: sometimes, doenst work, make sure to install the package again
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dark.homies.69@gmail.com",
    pass: "darkhomiesrules",
  },
});

const actions = {
  // firebase config
  firebaseConfig: {
    apiKey: "AIzaSyB6xHPzgETutLR0nHxg9MwdTy4AgKBf5IQ",
    authDomain: "matchimal.firebaseapp.com",
    databaseURL:
      "https://matchimal-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "matchimal",
    storageBucket: "matchimal.appspot.com",
    messagingSenderId: "356278738091",
    appId: "1:356278738091:web:073d796366b6c86ab7ebee",
    measurementId: "G-8TFN5HVQZV",
  },
};

module.exports = actions;
