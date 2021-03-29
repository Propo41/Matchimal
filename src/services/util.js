const config = require("../config/global.js");
require("firebase/auth");
require("firebase/database");
var firebase = require("firebase/app");
const nodemailer = require("nodemailer");
const { format } = require("util");
const { v4: uuidv4 } = require("uuid");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
  keyFilename: "./src/config/serviceAccountKey.json",
});
global.XMLHttpRequest = require("xhr2");

const bucket = storage.bucket("matchimal.appspot.com");
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
  sendEmail: async function (contactUsInfo) {
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

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "dark.homies.69@gmail.com",
        pass: "darkhomiesrules",
      },
    });

    await transporter.sendMail(mailOptions, function (error, info) {
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
   * @returns object {status: "success/failure"}
   */
  addPet: async function (pet, file) {
    // push the pet into database at: pets/$pet and users/$uid/pets/$pet$Id
    const petKey = firebase.database().ref("pets/").push().key;
    var updates = {};
    // upload the image to storage
    url = await module.exports.uploadImageToStorage(file, petKey);
    // get the download url from firebase storage.
    // this can be done directly from the returned url of uploadImageToStorage()
    // but the url is not public.
    console.log("File available at: ", url);
    pet.petImageUrl = url;
    updates[`/pets/${petKey}`] = pet;
    updates[`/users/${pet.ownerUid}/pets/${petKey}`] = true;
    await firebase.database().ref().update(updates);
    return { status: "success" };
  },

  /**
   * Upload the image file to Google Storage
   * @param {File} file object that will be uploaded to Google Storage
   */
  uploadImageToStorage: function (file, petKey) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject("No image file");
      }
      let newFileName = petKey; // file name
      let fileUpload = bucket.file(newFileName);
      const uuid = uuidv4();
      console.log(uuid);
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            firebaseStorageDownloadTokens: uuid,
          },
        },
      });
      blobStream.on("error", (error) => {
        console.log(error.message);
        reject("Something is wrong! Unable to upload at the moment.");
      });
      blobStream.on("finish", () => {
        // The public URL can be used to directly access the file via HTTP.
        const url = format(
          `https://firebasestorage.googleapis.com/v0/b/matchimal.appspot.com/o/${petKey}?alt=media&token=${uuid}`
        );
        resolve(url);
      });

      blobStream.end(file.buffer);
    });
  },

  /**
   *
   * @param {*} loginInfo an object containing user's email and pass
   * @returns object containing status, uid, and message for the reply
   */
  signInUser: async function (loginInfo) {
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
          await firebase.database().ref(`users/${userUid}/profile`).set({
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

  getMyPets: async function (userUid) {
    var petKeys = [];
    var pets = [];
    // fetch the keys belonging the user's pets
    var snapshot = await firebase
      .database()
      .ref(`users/${userUid}/pets/`)
      .once("value");
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        petKeys.push(child.key);
      });
      // use those keys to get the pet objects
      snapshot = await firebase.database().ref(`pets/`).once("value");
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          if (petKeys.includes(child.key)) {
            val = child.val();
            val.key = child.key;
            pets.push(val);
          }
        });
      }
    }
    console.log("my pets: ");
    console.log(pets);
    return pets;
  },

  deletePet: async function (key, userUid) {
    var updates = {};
    updates[`/pets/${key}/`] = null;
    updates[`/users/${userUid}/pets/${key}/`] = null;
    await firebase.database().ref().update(updates);
    return true;
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

  getTeamInfo: async function () {
    var team = [];
    var snapshot = await firebase.database().ref(`team/`).once("value");
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        team.push(child.val());
      });
      return team;
    }
  },

  /**
   * inserts team info in database.
   * call this function to insert the data into firebase
   */
  addTeamInfo: async function () {
    var team = [];
    member1 = {
      name: "Ali Ahnaf Swapnil",
      contribution: "Back-End Developer",
      description: "lorem epsum lorem",
      image:
        "https://firebasestorage.googleapis.com/v0/b/matchimal.appspot.com/o/ali.jpg?alt=media&token=6dfc8068-3162-4095-b9b4-ccb1b3d9b8ac",
      facebook: "https://www.facebook.com/ahnaf.swapnil/",
      linkedin: "https://www.linkedin.com/in/ali-ahnaf-19433110a/",
      github: "https://github.com/Propo41",
    };
    member2 = {
      name: "Mustofa Ahmed",
      contribution: "Front-End and Partial Back-End Developer",
      description: "lorem epsum lorem lorem lorem lorem bb",
      image:
        "https://firebasestorage.googleapis.com/v0/b/matchimal.appspot.com/o/mus.PNG?alt=media&token=b3e15b28-aa2f-420c-996e-cf717452a67c",
      facebook: "https://www.facebook.com/ahnaf.swapnil/",
      linkedin: "https://www.linkedin.com/in/ali-ahnaf-19433110a/",
      github: "https://github.com/Propo41",
    };
    member3 = {
      name: "Samia Sabrina Abyob",
      contribution: "Front-End Developer",
      description: "lorem epsum lorem lorem lorem lorem cc",
      image:
        "https://firebasestorage.googleapis.com/v0/b/matchimal.appspot.com/o/samia.PNG?alt=media&token=da808f4f-a764-4433-bfc6-e2c4be5c82cf",
      facebook: "https://www.facebook.com/ahnaf.swapnil/",
      linkedin: "https://www.linkedin.com/in/ali-ahnaf-19433110a/",
      github: "https://github.com/Propo41",
    };
    team.push(member1);
    team.push(member2);
    team.push(member3);
    firebase.database().ref(`team/`).set(team);
  },

  signInAdmin: async function () {
    ref = firebase.database().ref(`/admin/`);
    // fetch all pet list from database
    let snapshot = await ref.once("value");
    admin = {};
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        admin[child.key] = child.val();
      });
      console.log("admin: ");
      console.log(admin);
      return admin;
    }
    return null;
  },

  getUsersList: async function () {
    var users = [];
    var snapshot = await firebase.database().ref(`users/`).once("value");
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        var profile = child.child("profile").val();
        profile.petCount = child.child("pets").numChildren();
        profile.userUid = child.key;
        users.push(profile);
      });
    }
    console.log("users: ");
    console.log(users);
    return users;
  },

  getPetsList: async function () {
    var pets = [];
    var snapshot = await firebase.database().ref(`pets/`).once("value");
    if (snapshot.exists()) {
      snapshot.forEach((shot) => {
        pet = shot.val();
        pet.petKey = shot.key;
        pets.push(pet);
      });
    }
    console.log("pets: ");
    console.log(pets);
    return pets;
  },

  getStatsForAdmin: async function () {
    snapshot = await firebase.database().ref("users").once("value");
    var userCount = snapshot.numChildren();
    snapshot2 = await firebase.database().ref("pets").once("value");
    var petCount = snapshot2.numChildren();
    return {
      userCount: userCount,
      petCount: petCount,
    };
  },

  /**
   * deletes user data and all pets associated with the user from the database
   * NOTE: it does not delete the user from the authentication console.
   * it's a bit difficult to implement that. Need to use admin SDK.
   */
  deleteUser: async function (userId) {
    var updates = {};
    var petsKeys = [];

    var snapshot = await firebase
      .database()
      .ref(`users/${userId}/pets/`)
      .once("value");
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        petsKeys.push(child.key);
      });
    }
    // removing all pets associated with this user
    petsKeys.forEach((petKey) => {
      updates[`/pets/${petKey}/`] = null;
    });
    updates[`/users/${userId}/`] = null;
    await firebase.database().ref().update(updates);
    return "success";
  },
};
