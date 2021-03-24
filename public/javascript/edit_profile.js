var aboutUsLoaded = false;
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

  const newData = {
    firstName: $("#firstName").val(),
    lastName: $("#lastName").val(),
    city: $("#city-about-me").val(),
    email: $("#email").val(),
    phoneNumber: $("#phoneNumber-about-us").val(),
    streetAddress: $("#streetAddress").val(),
  };

  sendToServer(
    { req: "about-updated", newData: newData },
    "/service-edit-profile-about-me-update"
  ).then((user) => {
    if (user.status == "success") {
      alert("Info updated successfully");
    } else {
      alert("Something went wrong. Try again later.");
    }
  });
});

/* ----- MY PETS- ---- */
$("#pets-tab").click((event) => {
  console.log("my pets clicked");
  aboutUsLoaded = false;
});

/* ----- ADD PETS ----- */
$("#add-tab").click((event) => {
  console.log("add pets clicked");
  aboutUsLoaded = false;
});

$("#addPet_updateBtn").click((event) => {
  console.log("update button clicked");
  const data = {
    petName: $("#petName").val(),
    primaryBreed: $("#primaryBreed").val(),
    recentDiagnosedDisease: $("#recentDiagnosedDisease").val(),
    birthDate: $("#birthDate").val(),
    vaccinationDate: $("#vaccinationDate").val(),
    gender: $("#gender").val(),
    bio: $("#bio").val(),
  };
  sendToServer(data, "/service-user-add-pet").then((res) => {
    if (res.status == "success") {
      // if saved to database successful, then update UI
      alert("Pet added successfully");
      resetFields();
    } else {
      console.log("replied from server: ");
      alert(res.status);
    }
  });
});

function resetFields() {
  $("#petName").val("");
  $("#primaryBreed").val("");
  $("#recentDiagnosedDisease").val("");
  $("#gender").val("");
  $("#vaccinationDate").val("");
  $("#birthDate").val("");
  $("#bio").val("");
}

async function sendToServer(data, url) {
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
