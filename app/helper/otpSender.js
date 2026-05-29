const axios = require('axios');
const APIKEY = process.env.OTP_API_KEY
const SenderId = process.env.OTP_SENDER_ID
const TemplateId = process.env.OTP_TEMPLATE_ID
const CountryCode = "+91"
module.exports = {
    sendOTP:  (mobile, otp) => {
        let url = `https://2factor.in/API/V1/${APIKEY}/SMS/${CountryCode}${mobile}/${otp}/${TemplateId}`
        axios.get(url)
            .then(function (response) {
                // Handle the response data
                console.log(response.data);
                return true;
            })
            .catch(function (error) {
                // Handle the error
                console.log(error);
                return false;

            });

    },
    verifyOTP: async(mobile, otp) => {
        let url = `https://2factor.in/API/V1/${APIKEY}/SMS/VERIFY3/${mobile}/${otp}`
        axios.get(url)
            .then(function (response) {
                // Handle the response data
                console.log(response.data);
                return true;

            })
            .catch(function (error) {
                // Handle the error
                console.log(error);
                return false;

            });
    }
}