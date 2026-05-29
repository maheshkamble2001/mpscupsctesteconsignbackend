const {
    Op,
    literal,
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
const { Sequelize } = require('../../../../models');

let Student = require('../../../../models').tbl_students;
let State = require('../../../../models').tbl_states;


exports.createStudent = async (req, res) => {
    try {
        let data = {};
        const request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            name: 'required',
            mobile: 'required',
            emailid: 'required',
            stateid: 'required|integer',
            city: 'required',
            address: 'required',
        });

        if (await v.fails()) return failedValidation(res, v);

        // Duplicate check
        const duplicate = await Student.findOne({
            where: {
                [Op.or]: [
                    { EmailID: request.emailid },
                    { Mobile: request.mobile }
                ],
                IsDeleted: false
            }
        });
        if (duplicate) return failed(res, "Student with the provided email or mobile already exists");

        data = await Student.create({
            Name: request.name,
            Mobile: request.mobile,
            EmailID: request.emailid,
            Password: "8XtgoO1U+ISEBzGXwrCVUA==", 
            StateID: request.stateid,
            City: request.city,
            Address: request.address,
            AdmissionDate: request.admissiondate || null,
            Status: true,
            IsDeleted: false,
            AddedOn: new Date()
        });

        return success(res, "Student created successfully", data);
    } catch (error) {
        console.error("createStudent error:", error);
        return failed(res, error.message);
    }
};


exports.editStudent = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            id: 'required|integer',
            name: 'required',
            mobile: 'required',
            emailid: 'required',
            stateid: 'required|integer',
            city: 'required',
            address: 'required',
        });
        if (await v.fails()) return failedValidation(res, v);

        const student = await Student.findOne({
            where: { ID: request.id, IsDeleted: false }
        });
        if (!student) return failed(res, "Student not found");

        // Duplicate check
        const duplicate = await Student.findOne({
            where: {
                [Op.or]: [
                    { EmailID: request.emailid },
                    { Mobile: request.mobile }
                ],
                IsDeleted: false,
                ID: { [Op.ne]: request.id }
            }
        });

        if (duplicate) return failed(res, "Student already exists");

        const updateData = {
            Name: request.name,
            Mobile: request.mobile,
            EmailID: request.emailid,
            StateID: request.stateid,
            City: request.city,
            Address: request.address,
            AdmissionDate: request.admissiondate || null,
        };

        await Student.update(updateData, { where: { ID: request.id } });

        return success(res, "Student updated successfully.");
    } catch (error) {
        console.error("editStudent error:", error);
        return failed(res, error.message);
    }
};


exports.deleteStudent = async (req, res) => {
    try {
        const request = await decrypter(req.body);
        const v = new Validator(request, { id: 'required|integer' });
        if (await v.fails()) return failedValidation(res, v);

        const student = await Student.findOne({
            where: { ID: request.id, IsDeleted: false }
        });
        if (!student) return failed(res, "Student not found");

        await Student.update({ IsDeleted: true }, { where: { ID: request.id } });

        return success(res, "Student deleted successfully.");
    } catch (error) {
        console.error("deleteStudent error:", error);
        return failed(res, error.message);
    }
};


exports.statusStudent = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, { id: 'required|integer' });
        if (await v.fails()) return failedValidation(res, v);

        const student = await Student.findOne({
            where: { ID: request.id, IsDeleted: false }
        });
        if (!student) return failed(res, "Student not found");

        const newStatus = !student.Status;

        await Student.update({ Status: newStatus }, { where: { ID: request.id } });

        return success(res, "Student status updated successfully.");
    } catch (error) {
        console.error("statusStudent error:", error);
        return failed(res, error.message);
    }
};


exports.getStudentDetails = async (req, res) => {
    try {
        const request = await decrypter(req.query);

        const v = new Validator(request, { id: 'required|integer' });
        if (await v.fails()) return failedValidation(res, v);

        const student = await Student.findOne({
            where: { ID: request.id, IsDeleted: false },
            include: [
                {
                    model: State,
                    as: 'State',
                    attributes: ['StateID', 'StateName']
                }
            ]
        });

        if (!student) return failed(res, "Student not found");

        return success(res, "Student details fetched successfully", { student });
    } catch (error) {
        console.error("getStudentDetails error:", error);
        return failed(res, error.message);
    }
};


exports.listStudents = async (req, res) => {
    try {
        let request = {};
        try {
            request = await decrypter(req.query);
            if (!request || Object.keys(request).length === 0) request = req.query;
        } catch {
            request = req.query;
        }

        let pageSize = request.limit ? parseInt(request.limit) : 10;
        let page = request.page ? parseInt(request.page) : 1;
        let offset = pageSize * (page - 1);
        let search = request.search ? request.search : "";

        let whereCondition = { IsDeleted: false };

        if (search) {
            page = 1;
            offset = 0;
            whereCondition = {
                ...whereCondition,
                [Op.or]: [
                    { Name: { [Op.substring]: search } },
                    { Mobile: { [Op.substring]: search } },
                    { EmailID: { [Op.substring]: search } },
                    { City: { [Op.substring]: search } },
                    { '$State.StateName$': { [Op.substring]: search } },
                ]
            };
        }

        const students = await Student.findAndCountAll({
            where: whereCondition,
            order: [['ID', 'DESC']],
            limit: pageSize,
            offset: offset,
            include: [
                {
                    model: State,
                    as: 'State',
                    attributes: ['StateID', 'StateName'],
                    required: false
                }
            ]
        });

        return success(res, "Students fetched successfully", {
            students: students.rows,
            total: students.count,
            page: page,
            limit: pageSize
        });
    } catch (error) {
        console.error("listStudents error:", error);
        return failed(res, error.message);
    }
};
