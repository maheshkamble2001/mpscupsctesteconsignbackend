const { dump } = require("../helper/logs");
const { failedRes } = require("../helper/response");

const clientAuth = async (req, res, next) => {
    try {
        let reqSecretKey = req.query.api_key;
        let apiKey = process.env.API_KEY;
        if (reqSecretKey) {
            if (reqSecretKey == apiKey) {
                next()  
            } else {
                return failedRes(res, "Internal Server Error.");
            }
        } else {
            return failedRes(res, "Internal Server Error.");
        }
    } catch (error) {
        return failedRes(res, "Internal Server Error.");
    }
};

module.exports = clientAuth;