
let Students = require('../../../../models').tbl_students;
const {
    Op,
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
const axios = require('axios');

exports.studentLogin = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            username: 'required',
            password: 'required'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const student = await Students.findOne({
            where: {
                [Op.or]: [
                    { EmailID: requests.username },
                    { Mobile: requests.username }
                ],
                IsDeleted: false
            },
            attributes: [
                'id',
                'Name',
                'EmailID',
                'Password',
                'Status',
                'Mobile',
            ]
        });

        if (!student) return failed(res, "User not found");
        if (student.status === 0) return failed(res, "Your account is inactive, please contact admin");

        if (requests.password != student.Password) {
            return failed(res, "Invalid Password.");
        }

        const token = await jwt.createToken({
            data: student.dataValues.id,
            studentid: student.dataValues.id
        });

        const data = {
            access_token: token,
            token_type: 'Bearer',
            expires_in: jwtConfig.ttl,
            studentid: student.ID,
            name: student.Name,
            email: student.EmailID,
            mobile: student.Mobile,
        };

        return success(res, "Login successfully!", data);

    } catch (error) {
        console.error("student Login error:", error);
        return failed(res, error.message);
    }
};
