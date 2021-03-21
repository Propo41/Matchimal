module.exports = {
    sendEmail:
        function (contactUsInfo) {
            // BUG: sometimes, doenst work, make sure to install the package again
            const nodemailer = require('nodemailer');
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'dark.homies.69@gmail.com',
                    pass: 'darkhomiesrules'
                }
            });

            var mailOptions = {
                from: contactUsInfo.email,
                to: 'aliahnaf327@gmail.com',
                subject: contactUsInfo.regarding,
                text:
                    contactUsInfo.email + "\n" +
                    contactUsInfo.firstName + "\n" +
                    contactUsInfo.lastName + "\n" +
                    contactUsInfo.message
            };


            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            
        }
}