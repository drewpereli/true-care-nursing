require('dotenv').config();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

module.exports = {
    sendMessage(m){
        m.from = `"TrueCare Website" <${process.env.EMAIL}>`; // sender address
        console.log('Sending email: ' + JSON.stringify(m));
        return transporter.sendMail(m);
    }
}