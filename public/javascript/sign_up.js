
/**
 * send the values to backend
 * signup user from backend and send a response back here
 * if response is success, then redirect user to homepage
 * else show failure prompt
 */
function signUp() {
    const userReg = {
        firstName: $('#first_name_field').val().trim(),
        lastName: $('#last_name_field').val().trim(),
        country: $('#country_field').val().trim(),
        email: $('#email_field').val().trim(),
        phoneNumber: $('#phone_number_field').val().trim(),
        password: $('#password_field').val().trim()
    };

    sendToServer(userReg).
        then(res => {
            if (res.status === 1) {
                // if saved to database successful, then redirect user
                alert("Registration successful. You will be redirected soon...");
                window.location = "/" + res.uid + "/find-matches";
            } else {
                alert(res.message);
            }
        }
        );
}


/**
 * sends a response to the server using POST
 * the client recieves the response and then replies back
 * the replied response is converted to json and returned to
 * the caller
 */
async function sendToServer(userReg) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userReg)
    }
    const res = await fetch('/service-user-registration', options);
    return await res.json();
}