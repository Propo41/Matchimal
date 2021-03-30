$(".fa-trash").click((event) => {
  listLength = $("#table-parent").children().length;
  for (var i = 0; i < listLength; i++) {
    if (event.target.id == `trash-icon${i}`) {
      console.log("delete clicked");
      var prompt = confirm("Are you sure you want to delete the user?");
      if (prompt) {
        // delete pet from database
        userId = $(`#trash-icon${i}`).data("uid");
        console.log(`key to delete: ${userId}`);
        data = { key: userId };
        sendToServer(data, "/service-admin-delete-user")
          .then((res) => {
            if (res.status == "success") {
              $(`#${i}`).remove();
              alert("User deleted successfully");
              window.location.reload();
            } else {
              console.log("replied from server: ");
              alert(res.status);
            }
          })
          .catch((e) => {
            console.log(e);
          });
      }
    }
  }
});

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
