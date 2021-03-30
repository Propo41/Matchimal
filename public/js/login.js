// TODO: APP CRASHES: The email address is badly formatted. To fix this, refer to the link
// https://stackoverflow.com/questions/43213748/firebase-auth-invalid-email-address-crashing-node-js-express-app
const spinner = $("#spinner_id");

function login() {
  loginInfo = {
    email: $("#email").val(),
    password: $("#password").val(),
  };

  if (loginInfo.email == "" || loginInfo.password == "") {
    alert("Fields are required");
  } else {
    sendToServer(loginInfo)
      .then((res) => {
        spinner.hide();
        if (res.status == 1) {
          //alert("Logged in successfully. Redirecting...");
          console.log("logging in.");
          window.location = "/" + res.uid + "/find-matches";
        } else {
          alert(res.message);
        }
      })
      .catch((e) => {
        spinner.hide();
        console.log("error: " + e.message);
        alert("Something went wrong.");
      });
  }
}

/**
 * sends a response to the server using POST
 * the client recieves the response and then replies back
 * the replied response is converted to json and returned to
 * the caller
 */
async function sendToServer(loginInfo) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginInfo),
  };

  spinner.show();
  const res = await fetch("/service-user-login", options);
  return await res.json();
}
