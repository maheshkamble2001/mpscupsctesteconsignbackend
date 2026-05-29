const jwt = require("jsonwebtoken");
const CryptoJS = require('crypto-js');
const {
    decrypter
} = require("../helper/crypto");
const {
    dump
} = require("../helper/logs");
let {
    success,
    failed,
    authFailed,
    failedValidation,
    response
} = require('../helper/response');
const {
    Validator
} = require("node-input-validator");
const Gpscourses = require('../../models').tbl_gpscourses
const Gpsexpaccess = require('../../models').tbl_gpsexpaccess

///////////////Authenticating admin /////////////////
module.exports = async function (req, res, next) {
    try {
        const endpoint = req.path;
        if (process.env.ENCRYPTION == 'false') {
            let restrictedRoute = ['/live/lecture/details', '/lecture-detail']
            if (!restrictedRoute.includes(endpoint)) {
                return response(res, 422, 'Access denied ')
            }
            next()
        } else {
            let restrictedRoute = ['/live/lecture/details', '/lecture-detail']
            if (!restrictedRoute.includes(endpoint)) {
                next()
            }
            var requestData = (req.query.reqData || req.body.reqData);
            var string = requestData.replace(/ /g, '+')
            var bytes = CryptoJS.AES.decrypt(string, process.env.ENCRYPTION_SECRET);
            var requests = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            let decoded = jwt.verify(requests.access_token, process.env.JWT_SECRET)
            let userId = decoded.UserID
            if (endpoint == '/live/lecture/details' || endpoint == '/lecture-detail') {
                const v = new Validator(requests, {
                    courseId: "required",
                    latitude: "required",
                    longitude: "required"
                });
                const matched = await v.check();
                if (!matched) {
                    return failedValidation(res, v);
                }
                let userLat = requests.latitude;
                let userLong = requests.longitude;
                //checking gpscourse access by radius
                let gpscourse = await Gpscourses.findOne({
                    where: {
                        CourseID: requests.courseId,
                        isdeleted: 0,
                        IsGPS: 1
                    }
                })
                if (gpscourse) {
                    // Haversine formula for calculating distances
                    const distanceFormula = `(
                6371 * acos(
                  cos(radians(${userLat})) * cos(radians(Gpscourses.latitude)) * cos(radians(Gpscourses.longitude) - radians(${userLong})) + 
                  sin(radians(${userLat})) * sin(radians(Gpscourses.latitude))
                )
              )`;
                    // Find locations within a certain distance from the user
                    const maxDistanceInKm = gpscourse.dataValues.Radius; // Adjust this value as needed
                    let gpscourse = await Gpscourses.findOne({
                        where: {
                            CourseID: requests.courseId,
                            isdeleted: 0,
                            IsGPS: 1
                        },
                        attributes: ['ID', 'CourseID', 'Latitude',
                            'Longitude',
                            [literal(distanceFormula), 'distance']
                        ]
                    })
                    if (gpscourse && gpscourse.dataValues.distance < maxDistanceInKm) {
                        //checking lecture access normal
                        let gpsexaccess = await Gpsexpaccess.findOne({
                            where: {
                                CourseID: requests.requests.courseId,
                                StudentID: userId
                            }
                        })
                        if (!gpsexaccess)
                            return response(res, 422, 'Access denied ')
                    }
                }
            }
            next()
        }
    } catch (error) {
        console.log(error);
        return authFailed(res, "Something went wrong");
    }
};