let {
    encrypter,
    decrypter
} = require('../helper/crypto');
let {
    dump
} = require("../helper/logs");
const { logger } = require("../helper/winston")
exports.success = function (res, message = 'Success', data = {}) {
    let response = {
        code: 200,
        message: message,
        data: data,
    };
    res.json(encrypter(response))
};

exports.response = function (res, status = 200, message = 'Success', data = {}) {
    let response = {
        code: status,
        message: message,
        data: data,
    };
    res.json(encrypter(response))
};

exports.failed = function (res, message = 'Failed', code = 100) {
    let response = {
        code: code,
        message: message,
    };
    logger.error(res)
    res.json(encrypter(response))
};

exports.authFailed = function (res, message = 'Failed') {
    let response = {
        code: 401,
        message: message,
    };
    logger.error(res)
    res.json(encrypter(response))
};

exports.failedValidation = function (res, v) {

    let first_key = Object.keys(v.errors)[0];
    let err = v.errors[first_key]["message"];

    let response = {
        code: 100,
        message: err,
    };
    logger.error(res)
    res.json(encrypter(response));
};

exports.validationFailedRes = function (res, v) {

    let first_key = Object.keys(v.errors)[0];
    let err = v.errors[first_key]["message"];

    let response = {
        code: 100,
        message: err,
    };
    logger.error(res)
    res.json(response);
};

exports.failedRes = function (res, message = 'Failed') {
    let response = {
        code: 100,
        message: message,
    };
    logger.error(res)
    res.json(response)
};

exports.successRes = function (res, message = 'Success', data = {}, status) {
    let response = {
        code: 200,
        message: message,
    };
    if (status == true || status == false) {
        response = Object.assign(response, {
            status: status
        })
    } else {
        response = Object.assign(response, {
            data: data
        })
    }
    res.json(response)
};

exports.authFailedRes = function (res, message = 'Failed') {
    let response = {
        code: 401,
        message: message,
    };
    logger.error(res)
    res.json(response)
};