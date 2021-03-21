
$(".section-2-circle").click(event => {
    console.log($("#list_container").children());
    listLength = $("#list_container").children().length;
    for (var i = 0; i < listLength; i++) {
        if (event.target.id == i) {
            console.log(i + " is clicked");
            sendToServer(i).
                then(res => {
                    if (res.status === "success") {
                        // if saved to database successful, then update UI
                        $("#icon" + res.index).attr("src", "image/ic_heart_filled.svg");
                    }
                }
                );
        }
    }
});

async function sendToServer(index) {
    const data = { index };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    const res = await fetch('/api', options);
    return await res.json();
}
