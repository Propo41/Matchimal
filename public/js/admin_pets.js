$(".fa-trash").click((event) => {
  listLength = $("#table-parent").children().length;
  for (var i = 0; i < listLength; i++) {
    if (event.target.id == `trash-icon${i}`) {
      console.log("delete clicked");
      var prompt = confirm("Are you sure you want to delete the user?");
      if (prompt) {
        // delete pet from database
        ownerUid = $(`#trash-icon${i}`).data("owneruid");
        petKey = $(`#pet-icon${i}`).data("petkey");
        console.log(`key to delete: ${ownerUid}`);
        data = { owner: ownerUid, pet: petKey };
        sendToServer(data, "/service-admin-delete-pet")
          .then((res) => {
            if (res.status == "success") {
              $(`#${i}`).remove();
              alert("Pet deleted successfully");
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
