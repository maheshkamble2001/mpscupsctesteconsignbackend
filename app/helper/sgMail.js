const sgMail = require('@sendgrid/mail');
exports.sendSgMail = async function (data) {
    try {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: data.to,
            nickname: data.subject,
            from: {
                "email": "admin@smartmove.com",
                "name": "smart move"
            },
            templateId: data.templateId,
            dynamicTemplateData: data.sgMailDynamicKey
        };

        var m = await sgMail.send(msg)
    } catch (error) {
        console.log(error)
       // dump("error", error)
    }
};