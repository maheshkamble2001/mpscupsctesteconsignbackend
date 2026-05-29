let TestType = require('../../../../models').tbl_testtypes;
let Examtype = require('../../../../models').tbl_examtype;
const {
    Op,
    Sequelize,
    literal
} = require("sequelize");


const jwt = require('../../../../utils/jwt.util');
let {
    dump
} = require('../../../helper/logs');
let {
    success,
    failed,
    failedValidation
} = require('../../../helper/response');
const jwtConfig = require('../../../../config/jwt.config');
const {
    Validator
} = require('node-input-validator');
const {
    decrypter, passwordEncrypter, dotNetPasswordEncrypt, dotNetPasswordDecrypt
} = require('../../../helper/crypto');
const {
    mail
} = require('../../../helper/mail');
const admin = require('../../../helper/adminAuth');
const {
    fn,
    col
} = require('../../../../models').sequelize
const axios = require("axios");

exports.listActiveTestTypes = async function (req, res) {
    try {
        // Use decrypted or normal request
        let requests = await decrypter(req.query);
        if (!requests || Object.keys(requests).length === 0) requests = req.query;

        // Fetch all active test types without pagination or search
        const testtypes = await TestType.findAll({
            where: { Status: 1 , IsDeleted: 0},
            attributes: ["ID", "TestType"],   // only required fields
            order: [["TestType", "ASC"]]
        });

        if (!testtypes.length)
            return failed(res, "Test types not found");

        return success(res, "Test types fetched successfully", { testtypes });

    } catch (error) {
        return failed(res, error.message);
    }
};
exports.listActiveExamTypes = async function (req, res) {
    try {
        // Use decrypted or normal request
        let requests = await decrypter(req.query);
        if (!requests || Object.keys(requests).length === 0) requests = req.query;

        // Fetch all active test types without pagination or search
        const examtypes = await Examtype.findAll({
            where: { status: 1 },
            attributes: ["id", "name"],   // only required fields
            order: [["name", "ASC"]]
        });

        if (!examtypes.length)
            return failed(res, "Exam types not found");

        return success(res, "Exam types fetched successfully", { examtypes });

    } catch (error) {
        return failed(res, error.message);
    }
};

