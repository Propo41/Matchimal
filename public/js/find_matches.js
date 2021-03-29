const spinner = $("#spinner_id");

$(".heart-icon").click((event) => {
  spinner.show();
  console.log($("#list_container").children());
  listLength = $("#list_container").children().length;
  if (listLength == 0) {
    spinner.hide();
  }
  for (var i = 0; i < listLength; i++) {
    console.log(event.target.id);
    if (event.target.id == "icon" + i) {
      if ($("#icon" + i).attr("src") == "image/ic_heart_filled.svg") {
        $("#icon" + i).attr("src", "image/ic_heart.svg");
      } else {
        $("#icon" + i).attr("src", "image/ic_heart_filled.svg");
      }
      console.log(i + " is clicked");

      sendToServer(i, null, "/service-matches-likes")
        .then((res) => {
          spinner.hide();
          if (res.status === "like") {
            // if saved to database successful, then update UI
            $("#icon" + res.index).attr("src", "image/ic_heart_filled.svg");
          } else if (res.status === "dislike") {
            console.log("replied from server: dislike");
            $("#icon" + res.index).attr("src", "image/ic_heart.svg");
          } else {
            alert("something's wrong");
            console.log(res);
          }
        })
        .catch(() => {
          spinner.hide();
          console.log("error like");
        });
      break;
    }
  }
});

async function sendToServer(index, msg, url) {
  const data = { index: index, msg: msg };
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

// love reacting
$(".section-2-img").click((event) => {
  console.log("profile clicked ");
  listLength = $("#list_container").children().length;
  for (var i = 0; i < listLength; i++) {
    if (event.target.id === "img" + i) {
      console.log("profile clicked at index: " + i);
      sendToServer(i, null, "/service-matches-profile-click")
        .then((res) => {
          window.location = res.url;
        })
        .catch((e) => {
          console.log("error");
        });
      break;
    }
  }
});
