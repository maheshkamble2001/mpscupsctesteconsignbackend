const nodemailer = require("nodemailer");
const USER = process.env.MAIL_USER;
const PASSWORD = process.env.MAIL_PASSWORD;
const mail = (req) => {
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: USER,
            pass: PASSWORD,
        },
    });
    var mailOptions = {
        from: USER,
        to: req.email ? req.email : USER,
        subject: req.subject ? req.subject : "Test Subject",
        text: req.text ? req.text : "Test Body",
        html: req.html ? req.html : "",
    };

    let resp = false;
    transporter.sendMail(mailOptions, function (error, info) {
        console.log(error, info);
        if (error) {
            resp = false;
        } else {
            resp = true;
        }
    });
    return resp;
};

const helpMail = (req) => {
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: USER,
            pass: PASSWORD,
        },
    });
    var mailOptions = {
        from: USER,
        to: req.email ? req.email : USER,
        subject: req.subject ? req.subject : "Test Subject",
        text: req.text ? req.text : "Test Body",
        html: req.html ? req.html : "",
    };

    let resp = false;
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            resp = false;
        } else {
            resp = true;
        }
    });
    return resp;
};

module.exports = {
    mail,
    helpMail
};