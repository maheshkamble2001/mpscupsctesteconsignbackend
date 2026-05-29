const jwt = require("jsonwebtoken");
const CryptoJS = require('crypto-js');
const { decrypter } = require("../helper/crypto");
const { dump } = require("../helper/logs");
let { success, failed, authFailed, failedValidation } = require('../helper/response');


///////////////Authenticating admin /////////////////
module.exports = function (req, res, next) {
  try {
    let token = "";
    let decoded = "";
    let userId = "";
    if (process.env.ENCRYPTION == 'false') {
      token = (req.headers.authorization ? req.headers.authorization.split(" ")[1] : "") || (req.body && req.body.access_token) || req.body.token || req.query.token || req.query.access_token || req.headers["x-access-token"];
      decoded = jwt.verify(token, process.env.JWT_SECRET)
      userId = decoded._id
      req.decodedData = decoded //doubt
      next()
    } else {
      var requestData = (req.query.reqData || req.body.reqData);
      var string = requestData.replace(/ /g, '+')
      var bytes = CryptoJS.AES.decrypt(string, process.env.ENCRYPTION_SECRET);
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      decoded = jwt.verify(decryptedData.access_token, process.env.JWT_SECRET),
        userId = decoded._id,
        req.decodedData = decoded, //doubt
        next()
    }
  } catch (error) {
    return authFailed(res, "Session Expired.");
  }
};