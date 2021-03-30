const name = document.getElementById("name");
const role = document.getElementById("role");
const description = document.getElementById("description");
const fb = document.getElementById("fbUrl");
const github = document.getElementById("githubUrl");
const linkedin = document.getElementById("linkedinUrl");

var ex1 = document.getElementById("radio1");
var ex2 = document.getElementById("radio2");
var ex3 = document.getElementById("radio3");

ex1.onclick = radioCall;
ex2.onclick = radioCall;
ex3.onclick = radioCall;

function update() {
  if (
    name.value.trim() === "" ||
    role.value.trim() === "" ||
    description.value.trim() === "" ||
    fb.value.trim() === "" ||
    github.value.trim() === "" ||
    linkedin.value.trim() === ""
  ) {
    window.alert("Field Cannot be Empty");
  }

  var radio = document.querySelector('input[name="memberNumber"]:checked')
    .value;
  console.log(radio);

  var member = {
    name: name.value.trim(),
    contribution: role.value.trim(),
    description: description.value.trim(),
    facebook: fb.value.trim(),
    github: github.value.trim(),
    linkedin: linkedin.value.trim(),
  };

  // update new data
  sendToServer({ member: member, number: radio }, "/service-admin-update-member")
    .then((res) => {
      if (res.status == "success") {
        alert("updated successfully");
      } else {
        alert("Something is wrong");
      }
    })
    .catch((e) => {
      alert(e.message);
    });
}

function radioCall() {
  var radio = document.querySelector('input[name="memberNumber"]:checked')
    .value;
  console.log(radio);
  window.location = `/admin/team-member/${radio}`;
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
