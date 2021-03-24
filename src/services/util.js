const config = require("../config/global.js");
var firebase = require("firebase/app");
require("firebase/auth");
require("firebase/database");

module.exports = {
  /**
   *
   * @returns user true if user is logged in, else false
   */
  isUserLoggedIn: function (serverResponse) {
    var user = firebase.auth().currentUser;
    if (user != null) {
      console.log("user already logged in. Redirecting to private page...");
      serverResponse.redirect(`/user/${uid}/find-matches`);
      return true;
    }
    return false;
  },
  /**
   *
   * @param {*} contactUsInfo contact info object
   */
  sendEmail: function (contactUsInfo) {
    var mailOptions = {
      from: contactUsInfo.email,
      to: "aliahnaf327@gmail.com",
      subject: contactUsInfo.regarding,
      text:
        contactUsInfo.email +
        "\n" +
        contactUsInfo.firstName +
        "\n" +
        contactUsInfo.lastName +
        "\n" +
        contactUsInfo.message,
    };

    config.transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
  },

  /**
   *
   * @param {*} petKey the random push key of the pet's node from the db
   * @param {*} serverResponse the response object from the server. This is will be used from this method to return the reply
   */
  toggleLikePet: async function (petKey, userUid, pet) {
    ref = firebase.database().ref(`users/${userUid}/likes/${petKey}`);
    // fetch info from database
    const snapshot = await ref.once("value");
    if (snapshot.exists()) {
      // if already liked, then unlike
      try {
        await ref.remove();
        return "dislike";
      } catch (e) {
        return "error";
      }
    } else {
      // like the pet and update in database
      try {
        console.log("pet: ");
        console.log(pet);
        await ref.set(pet);
        return "like";
      } catch (e) {
        return "error";
      }
    }
  },

  /**
   *
   * @param {*} pet an object containing info about the pet
   * @param {*} userUid the current session's user's uid
   * @returns object {status: "success/failure"}
   */
  addPet: async function (pet, userUid) {
    // push the pet into database at: pets/$pet and users/$uid/pets/$pet$Id
    const petKey = firebase.database().ref("pets/").push().key;
    var updates = {};
    updates[`/pets/${petKey}`] = pet;
    updates[`/users/${userUid}/pets/${petKey}`] = true;
    try {
      await firebase.database().ref().update(updates);
      return { status: "success" };
    } catch (e) {
      console.log("error: " + e.message);
      return { status: "failure" };
    }
  },
  /**
   *
   * @param {*} loginInfo an object containing user's email and pass
   * @returns object containing status, uid, and message for the reply
   */
  signInUser: async function (loginInfo) {
    try {
      const userCredential = await firebase
        .auth()
        .signInWithEmailAndPassword(loginInfo.email, loginInfo.password);
      console.log("logged in successfully");
      var userUid = userCredential.user.uid;
      return {
        status: 1,
        uid: userUid,
        message: "success",
      };
    } catch (e) {
      console.error("error: " + e.message);
      return {
        status: -1,
        uid: null,
        message: e.message,
      };
    }
  },

  /**
   *
   * @param {*} user object containing user's signup informatin
   * @param {*} serverResponse the response object from the server. This is will be used from this method to return the reply
   */
  registerUser: async function (user) {
    try {
      const res = await firebase
        .auth()
        .createUserWithEmailAndPassword(user.email, user.password);
      var uid = null;
      if (res.user != null) {
        if (!res.additionalUserInfo.isNewUser) {
          console.log("user email exists!");
          return {
            status: -1,
            uid: null,
            message: "Your email already exists",
          };
        } else {
          userUid = res.user.uid;
          await firebase
            .database()
            .ref(`users/${userUid}/profile`)
            .set({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              country: user.country,
            });
          console.log("registration successful!");
          return { status: 1, uid: userUid, message: null };
        }
      }
    } catch (e) {
      console.log("registration failed: " + e.message);
      return {
        status: -2,
        uid: null,
        message: e.message,
      };
    }
  },

  /**
   *
   * deletes the key from availablePetsKeys and corresponding index of availablePets
   */
  remove: function (availablePetsKeys, availablePets, key) {
    const index = availablePetsKeys.indexOf(key);
    if (index !== -1) {
      availablePetsKeys.splice(index, 1);
      availablePets.splice(index, 1);
    }
  },
  /**
   *
   * @param {*} userUid
   * @returns
   */
  fetchPetsAvailable: async function (userUid) {
    const availablePets = [];
    const availablePetsKeys = [];
    const usersLikedPetKeysIndex = [];

    console.log("fetching pets from database");
    ref = firebase.database().ref("/pets/");
    // fetch all pet list from database
    let snapshot = await ref.once("value");
    if (snapshot.exists()) {
      console.log("pet list found! ");
      snapshot.forEach((snap) => {
        availablePets.push(snap.val());
        availablePetsKeys.push(snap.key);
      });
      // fetch pet list keys belonging to the current user
      ref = firebase.database().ref(`/users/${userUid}/pets/`);
      snapshot = await ref.once("value");
      usersPetKeys = [];
      if (snapshot.exists()) {
        console.log("pet list found of user! ");
        snapshot.forEach((snap) => {
          usersPetKeys.push(snap.key);
        });
        //remove the pets that belongs to the user from availablePets list
        usersPetKeys.forEach((key) => {
          if (availablePetsKeys.includes(key)) {
            module.exports.remove(availablePetsKeys, availablePets, key);
          }
        });
      }
      // fetch pet list keys that the user liked
      ref = firebase.database().ref(`/users/${userUid}/likes/`);
      snapshot2 = await ref.once("value");
      if (snapshot2.exists()) {
        console.log("liked list found of user! ");
        // adding which pets were previously liked
        snapshot2.forEach((snap) => {
          index = availablePetsKeys.indexOf(snap.key);
          if (index != -1) {
            usersLikedPetKeysIndex.push(index);
          }
        });
        console.log(usersLikedPetKeysIndex);
      }
    }
    return { availablePets, availablePetsKeys, usersLikedPetKeysIndex };
  },

  fetchMyLikes: async function (userId) {
    const myLikes = [];
    ref = firebase.database().ref(`/users/${userId}/likes/`);
    // fetch all pet list from database
    try {
      let snapshot = await ref.once("value");
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          myLikes.push(child.val());
        });
      } else {
        console.log("my likes list empty");
      }
    } catch (e) {
      console.error(e.message);
    }
    return myLikes;
  },

  fetchPetProfile: async function (petKey) {
    ref = firebase.database().ref(`/pets/${petKey}`);

    // fetch all pet list from database
    let snapshot = await ref.once("value");
    if (snapshot.exists()) {
      console.log("pet: ");
      console.log(snapshot.val());
      return snapshot.val();
    }
  },

  getUserInfo: async function (userId) {
    ref = firebase.database().ref(`/users/${userId}/profile`);
    // fetch all pet list from database
    let snapshot = await ref.once("value");
    if (snapshot.exists()) {
      return snapshot.val();
    }
  },

  updateUserInfo: async function (userUid, user) {
    ref = firebase.database().ref(`/users/${userUid}/profile`);
    let snapshot = await ref.once("value");
    if (snapshot.exists()) {
      await ref.set(user);
      return;
    } else {
      console.log("no data exists");
    }
  },
};
