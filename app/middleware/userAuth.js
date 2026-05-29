const jwt = require("jsonwebtoken");
const CryptoJS = require('crypto-js');
const {
  decrypter
} = require("../helper/crypto");
const {
  dump
} = require("../helper/logs");
let db = require('../../models');
let userloginlogs = db.tbl_userloginhistory;
let LectureViewList = db.tbl_lectureviewlist
let {
  success,
  failed,
  authFailed,
  failedValidation
} = require('../helper/response');


///////////////Authenticating admin /////////////////
module.exports = function (req, res, next) {
  try {
    let token = "";
    let decoded = "";
    let userId = "";
    if (process.env.ENCRYPTION == 'false') {
      token = (req.headers.authorization ? req.headers.authorization.split(" ")[1] : "") || (req.body && req.body.access_token) || req.body.token || req.query.token || req.query.access_token || req.headers["x-access-token"];
      decoded = jwt.verify(token, process.env.JWT_SECRET)
      userId = decoded.UserID
      req.decodedData = decoded //doubt
      // next()
    } else {
      var requestData = (req.query.reqData || req.body.reqData);
      var string = requestData.replace(/ /g, '+')
      var bytes = CryptoJS.AES.decrypt(string, process.env.ENCRYPTION_SECRET);
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      token = decryptedData.access_token
      decoded = jwt.verify(decryptedData.access_token, process.env.JWT_SECRET),
        userId = decoded.UserID,
        req.decodedData = decoded //doubt
      // next()
    }

    let userLoginHistory = userloginlogs.findOne({
      where: {
        studentId: userId,
        access_token: token
      }
    }).then(e => {
      if (e == null) {
        return authFailed(res, "Multiple login activity is noticed, User will be logged out.");
      } else {
        if (e.dataValues.access_token) {
          let savedToken = jwt.verify(e.dataValues.access_token, process.env.JWT_SECRET)
          if (savedToken.platformType && savedToken.platformType != decoded.platformType) {
            return authFailed(res, "Invalid auth token.");
          }
        }
      }
    })
    const endpoint = req.path;
    let routes = ['/notification/list']
      if (!routes.includes(endpoint)) {
          // next()
      } else {
        LectureViewList.update({
          is_currently_playing : 0
        },{
          where : {
            userId : userId
          }
        }).then(e => {
          // next()
        })
      }
      next()
  } catch (error) {
    console.log(error);
    return authFailed(res, "Session Expired.");
  }
};