let TestType = require('../../../../models').tbl_testtypes;
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

exports.createTestType = async function (req, res) {
    try {
        let data = {};

        var requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            testtype: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const duplicate = await TestType.findOne({
            where: {
                TestType: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("TestType")),
                    requests.testtype.toLowerCase()
                ),
                Status: 1,
                IsDeleted: 0
            }
        });

        if (duplicate) return failed(res, "Test type already exists");

        const reqData = {
            TestType: requests.testtype,
            Status: 1,
            IsDeleted: 0,
            AddedOn: new Date()
        };

        data = await TestType.create(reqData);

        return success(res, "Success", data);

    } catch (error) {
        dump("error", error);
        return failed(res, error.message);
    }
};

exports.editTestType = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            id: 'required',
            testtype: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const existing = await TestType.findOne({
            where: { ID: requests.id }
        });

        if (!existing) return failed(res, "Test type not found");

        const duplicate = await TestType.findOne({
            where: {
                TestType: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("TestType")),
                    requests.testtype.toLowerCase()
                ),
                ID: { [Op.ne]: requests.id },
                IsDeleted: 0
            }
        });

        if (duplicate) return failed(res, "Test type already exists");

        const reqData = {
            TestType: requests.testtype,
            Status: 1,
            IsDeleted: 0
        };

        await TestType.update(reqData, { where: { ID: requests.id } });

        return success(res, "Test type updated successfully", reqData);

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.listTestTypes = async function (req, res) {
    try {
        let requests = await decrypter(req.query);
        if (!requests || Object.keys(requests).length === 0) requests = req.query;

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = { IsDeleted: 0 };

        if (search !== "") {
            whereClause[Op.or] = [
                { TestType: { [Op.substring]: search } }
            ];
        }

        const { rows: testtypes, count: totalRecords } = await TestType.findAndCountAll({
            where: whereClause,
            attributes: ['ID', 'TestType', 'Status', 'AddedOn'],
            order: [['ID', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return success(res, "Test type list fetched successfully", {
            testtypes,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.listActiveTestTypes = async function (req, res) {
    try {
        // Use decrypted or normal request
        let requests = await decrypter(req.query);
        if (!requests || Object.keys(requests).length === 0) requests = req.query;

        // Fetch all active test types without pagination or search
        const testtypes = await TestType.findAll({
            where: { Status: 1, IsDeleted: 0 },
            attributes: ["ID", "TestType"],   // only required fields
            order: [["TestType", "ASC"]]
        });

        if (!testtypes.length)
            return failed(res, "Active test types not found");

        return success(res, "Active test types fetched successfully", { testtypes });

    } catch (error) {
        return failed(res, error.message);
    }
};


exports.statusTestType = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            id: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const testType = await TestType.findOne({
            where: { ID: requests.id }
        });

        if (!testType) return failed(res, "Test type not found");

        const updatedStatus = testType.Status === 1 ? 0 : 1;

        await TestType.update(
            { Status: updatedStatus },
            { where: { ID: requests.id } }
        );

        return success(res, "Test type status changed");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.deleteTestType = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            id: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const testType = await TestType.findOne({
            where: { ID: requests.id }
        });

        if (!testType) return failed(res, "Test type not found");

        await TestType.update(
            { IsDeleted: 1 },
            { where: { ID: requests.id } }
        );

        return success(res, "Test type deleted successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

