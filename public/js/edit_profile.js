var aboutUsLoaded = false;
var reader;
var imageSelected = false;
var imageInput = document.getElementById("img-input");
const spinner = $("#spinner_id");

// loading user info
if (!aboutUsLoaded) {
  fetchUserInfo();
}

/* ----- ABOUT ME- ---- */
$("#about-tab").click((event) => {
  console.log("about me clicked");
  fetchUserInfo();
  aboutUsLoaded = true;
});

$("#about-me-update-btn").click((event) => {
  console.log("update clicked");
  var flag = false;

  const newData = {
    firstName: $("#firstName").val(),
    lastName: $("#lastName").val(),
    city: $("#city-about-me").val(),
    email: $("#email").val(),
    phoneNumber: $("#phoneNumber-about-us").val(),
    streetAddress: $("#streetAddress").val(),
  };

  for (var [key, value] of Object.entries(newData)) {
    if (value == "" && key != "streetAddress") {
      flag = true;
      alert("Input fields need to be filled");
      break;
    }
  }

  if (!flag) {
    spinner.show();
    sendToServer(
      { req: "about-updated", newData: newData },
      "/service-edit-profile-about-me-update"
    )
      .then((user) => {
        spinner.hide();
        if (user.status == "success") {
          alert("Info updated successfully");
        } else {
          alert("Something went wrong. Try again later.");
        }
      })
      .catch((e) => {
        spinner.hide();
        console.log(e.message);
      });
  }
});

/* ----- MY PETS- ---- */

$("#pets-tab").click((event) => {
  console.log($("#my-pets-list-container").children());

  const myNode = document.getElementById("my-pets-list-container");
  myNode.innerHTML = "";

  const parent = $("#my-pets-list-container");
  parent.textContent = "";
  console.log("my pets clicked");
  aboutUsLoaded = false;
  spinner.show();
  // fetch the list of pets of the user from db
  sendToServer({ req: "pets-clicked" }, "/service-edit-profile-my-pets")
    .then((pets) => {
      spinner.hide();
      console.log("data received from server");
      if (pets.length == 0) {
        console.log("pet length 0");
        addPlaceHolderImage();
        $("#my-pets-place-holder").css("visibility", "hidden");
      } else {
        var i = 0;
        pets.forEach((pet) => {
          console.log("printing: " + pet.petName);
          addPetRow(pet, i);
          i++;
        });
      }
    })
    .catch((e) => {
      spinner.hide();
      console.log("error at my pets client");
      console.log(e);
    });
});

function addPetRow(pet, i) {
  const div = document.createElement("div");
  div.className = "my-pet-container";
  div.innerHTML = `
  <div class="container-float-left">
        <img style="cursor: pointer;" id="pet-icon${i}" class="my-pet-image" src="${pet.petImageUrl}" alt="">
  </div>
  <div class="container-float-left add-pet-text">
        <h3 class="myPets-list-header"> ${pet.petName} </h3>
        <h4 class="myPets-list-body">Breed: ${pet.primaryBreed}</h4>
        <h4 class="myPets-list-body">Gender: ${pet.gender}</h4>
  </div>
  <div class="add-pet-delete container-float-right">
       <a style="cursor: pointer;" class = "trash-icon" id="delete-item${i}"><i class="fa fa-trash"></i></a>
  </div>`;
  $("#my-pets-list-container").append(div);
  $(`#pet-icon${i}`).click((event) => {
    /*     window.location = `/${pet.ownerUid}/view-profile/${key}`;
     */ /*    location.replace(`/${pet.ownerUid}/view-profile/${key}`); */
    window.location.href = `/${pet.ownerUid}/view-profile/${pet.key}`;

    console.log("redirecting..");
  });

  $(`#delete-item${i}`).click((event) => {
    var prompt = confirm("Are you sure you want to delete the pet?");
    if (prompt) {
      // delete pet from database
      console.log(`key to delete: ${pet.key}`);
      data = { key: pet.key };
      sendToServer(data, "/service-user-delete-pet")
        .then((res) => {
          if (res.status == "success") {
            if ($("#my-pets-list-container").children().length == 0) {
              addPlaceHolderImage();
            } else {
              alert("Pet deleted successfully");
              div.remove();
            }
          } else {
            console.log("replied from server: ");
            alert(res.status);
          }
        })
        .catch((e) => {
          console.log(e);
        });
    }
  });
}

function addPlaceHolderImage() {
  const div = document.createElement("div");
  div.innerHTML = `
    <div id="my-pets-placeholder" style="text-align:center;">
    <img class="my-pet-image my-pet-image-dimension" 
    src="/public/image/ic_cat_sleeping.png" alt="">
    </div>
    `;
  $("#my-pets-list-container").append(div);
}

/* ----- ADD PETS ----- */
$("#add-tab").click((event) => {
  console.log("add pets clicked");
  aboutUsLoaded = false;
});

// when image is selected, update the ui
imageInput.onchange = (e) => {
  imageSelected = true;
  var files = [];
  console.log("image selected");
  files = e.target.files;
  var reader = new FileReader();
  reader.onload = function (e) {
    $("#pet_img").attr("src", e.target.result);
  };
  reader.readAsDataURL(files[0]);
};
/**
 * adds the pet when the add pet button is clicked
 * @param {*} form the form data
 */
function onPetAddClick(form) {
  var flag = false;
  var formData = new FormData(form);

  for (var [key, value] of formData.entries()) {
    console.log("ITERATING: " + key, value);
    if (
      value == "" &&
      key != "recentDiagnosedDisease" &&
      key != "vaccinationDate"
    ) {
      flag = true;
      alert("Input fields need to be filled");
      break;
    }
  }

  if (!flag && imageSelected) {
    spinner.show();
    sendToServerMulter(formData, "/service-user-add-pet")
      .then((res) => {
        spinner.hide();
        console.log(res);
        alert("Pet successfully added");
        resetFields();
      })
      .catch((e) => {
        spinner.hide();
        console.log(e);
        alert(e.message);
      });
  } else {
    alert("You must choose an image!");
  }

  return false; //don't submit
}

async function sendToServerMulter(data, url) {
  console.log("sending data to server: ");
  console.log(data);
  const options = {
    method: "POST",
    body: data,
  };

  const res = await fetch(url, options);
  return await res.json();
}

function resetFields() {
  $("#petName").val("");
  $("#primaryBreed").val("");
  $("#recentDiagnosedDisease").val("");
  $("#gender").val("");
  $("#vaccinationDate").val("");
  $("#birthDate").val("");
  $("#bio").val("");
  $("#pet_img").attr("src", "./image/ic_dummy_pet.png");
}

async function sendToServer(data, url) {
  console.log("sending data to server: ");
  console.log(data);
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  const res = await fetch(url, options);
  return await res.json();
}

function fetchUserInfo() {
  if (!aboutUsLoaded) {
    sendToServer(
      { req: "about-clicked" },
      "/service-edit-profile-about-me"
    ).then((user) => {
      $("#firstName").val(user.firstName);
      $("#lastName").val(user.lastName);
      $("#city-about-me").val(user.city);
      $("#email").val(user.email);
      $("#phoneNumber-about-us").val(user.phoneNumber);
      $("#streetAddress").val(user.streetAddress);
    });
    aboutUsLoaded = true;
  }
}
