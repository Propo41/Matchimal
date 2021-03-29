var imageInput = document.getElementById("img-input");
var ImgName, ImgUrl;
var files = [];
var reader;

imageInput.onchange = (e) => {
  console.log("input selected");
  files = e.target.files;
  reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("pet-image").src = e.target.result;
  };
  reader.readAsDataURL(files[0]);
};

function onSubmit(form) {
  const thisForm = document.getElementById("form-id");
  var inputImage = document.getElementById("img-input");
  var formData = new FormData(thisForm);
  for (var [key, value] of formData.entries()) {
    console.log(key, value);
  }

  sendToServer(formData, "/profile")
    .then((res) => {
      console.log(res);
    })
    .catch((e) => {
      console.log(e);
    });

  return false; //don't submit
}

async function sendToServer(data, url) {
  console.log("sending data to server: ");
  console.log(data);
  const options = {
    method: "POST",
    body: data,
  };

  const res = await fetch(url, options);
  return await res.json();
}
