function login() {
    alert("login clicked");
    loginInfo = {
        email: $("#email").val(),
        password: $("#password").val()

    };
    sendToServer(loginInfo).then(res=>{
        if(res.status == 1){
            alert("Logged in successfully. Redirecting...");
            window.location = "/" + res.uid + "/find-matches";
        }else {
            alert(res.message);
        }
    });



}

/**
 * sends a response to the server using POST
 * the client recieves the response and then replies back
 * the replied response is converted to json and returned to
 * the caller
 */
async function sendToServer(loginInfo) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginInfo)
    }
    const res = await fetch('/service-user-login', options);
    return await res.json();
}