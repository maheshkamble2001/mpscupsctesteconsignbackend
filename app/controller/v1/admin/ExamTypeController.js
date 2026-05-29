let ExamType = require('../../../../models').tbl_examtype;
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


// CREATE Exam Type
exports.createExamType = async function (req, res) {
    try {
        let data = {};

        let requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            name: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // CHECK DUPLICATE
        const duplicate = await ExamType.findOne({
            where: {
                name: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("name")),
                    requests.name.toLowerCase()
                ),
                isdeleted: 0
            }
        });

        if (duplicate) return failed(res, "Exam type already exists");

        const reqData = {
            name: requests.name,
            status: 1,
            isdeleted: 0,
            addedOn: new Date()
        };

        data = await ExamType.create(reqData);

        return success(res, "Exam type created successfully", data);

    } catch (error) {
        return failed(res, error.message);
    }
};


// EDIT Exam Type
exports.editExamType = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            id: 'required|integer',
            name: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const existing = await ExamType.findOne({
            where: { id: requests.id, isdeleted: 0 }
        });

        if (!existing) return failed(res, "Exam type not found");

        const duplicate = await ExamType.findOne({
            where: {
                name: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("name")),
                    requests.name.toLowerCase()
                ),
                id: { [Op.ne]: requests.id },
                isdeleted: 0
            }
        });

        if (duplicate) return failed(res, "Exam type already exists");

        await ExamType.update(
            { name: requests.name },
            { where: { id: requests.id } }
        );

        return success(res, "Exam type updated successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};


// LIST Exam Types (pagination + search)
exports.listExamTypes = async function (req, res) {
    try {
        let requests = await decrypter(req.query);
        if (!requests || Object.keys(requests).length === 0) requests = req.query;

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = { isdeleted: 0 };

        if (search !== "") {
            whereClause[Op.or] = [
                { name: { [Op.substring]: search } }
            ];
        }

        const { rows: examtypes, count: totalRecords } = await ExamType.findAndCountAll({
            where: whereClause,
            attributes: ["id", "name", "status", "addedOn"],
            order: [["id", "DESC"]],
            limit,
            offset
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return success(res, "Exam type list fetched successfully", {
            examtypes,
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


// LIST ACTIVE Exam Types
exports.listActiveExamTypes = async function (req, res) {
    try {
        let requests = await decrypter(req.query);
        if (!requests || Object.keys(requests).length === 0) requests = req.query;

        const examtypes = await ExamType.findAll({
            where: { status: 1, isdeleted: 0 },
            attributes: ["id", "name"],
            order: [["name", "ASC"]]
        });

        if (!examtypes || examtypes.length === 0)
            return failed(res, "Active exam types not found");

        return success(res, "Active exam types fetched successfully", { examtypes });

    } catch (error) {
        return failed(res, error.message);
    }
};


// STATUS CHANGE (toggle 1/0)
exports.changeExamTypeStatus = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            id: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const examtype = await ExamType.findOne({
            where: { id: requests.id, isdeleted: 0 }
        });

        if (!examtype) return failed(res, "Exam type not found");

        const updatedStatus = examtype.status === 1 ? 0 : 1;

        await ExamType.update(
            { status: updatedStatus },
            { where: { id: requests.id } }
        );

        return success(res, "Exam type status updated");

    } catch (error) {
        return failed(res, error.message);
    }
};


// SOFT DELETE (isdeleted = 1)
exports.deleteExamType = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            id: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const examType = await ExamType.findOne({
            where: { id: requests.id, isdeleted: 0 }
        });

        if (!examType) return failed(res, "Exam type not found");

        await ExamType.update(
            { isdeleted: 1 },
            { where: { id: requests.id } }
        );

        return success(res, "Exam type deleted successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.getExamTypeDropdown = async function (req, res) {
  try {
    const examtypes = await ExamType.findAll({
      where: {
        isdeleted: 0,
        status: 1, // only active
      },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    const dropdown = examtypes.map((item) => ({
      value: item.id,
      label: item.name,
    }));

    return success(res, "Exam type dropdown fetched successfully", dropdown);
  } catch (error) {
    return failed(res, error.message);
  }
};

