function login() {
  console.log("login clicked");
  loginInfo = {
    id: $("#id").val(),
    pin: $("#pin").val(),
  };

  sendToServer(loginInfo).then((res) => {
    if (res.status == 1) {
      console.log("logging in.");
      window.location = "/admin/home";
    } else {
      alert(res.message);
    }
  });
}

async function sendToServer(loginInfo) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginInfo),
  };
  const res = await fetch("/service-admin-login", options);
  return await res.json();
}
