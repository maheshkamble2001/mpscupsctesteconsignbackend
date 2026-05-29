let User = require('../../../../models').tbl_adminusers;
let State = require('../../../../models').tbl_states;
let UserType = require('../../../../models').tbl_usertypes;
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

exports.createUser = async (req, res) => {
    try {
        let data = {};
        const request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            firstname: 'required',
            lastname: 'required',
            emailid: 'required',
            mobile: 'required',
        });

        if (await v.fails()) {
            return failedValidation(res, v);
        }

        const duplicate = await User.findOne({
            where: {
                [Op.or]: [
                    { EmailID: request.emailid },
                    { Mobile: request.mobile }
                ],
                IsDeleted: false
            }
        });
        if (duplicate) return failed(res, "User with same details already exists");

        data = await User.create({
            UserTypeID: request.usertypeid,
            FirstName: request.firstname,
            LastName: request.lastname,
            EmailID: request.emailid,
            UserName: request.username,
            Password: "8XtgoO1U+ISEBzGXwrCVUA==",
            Mobile: request.mobile,
            Address: request.address,
            City: request.city,
            StateID: request.stateid,
            ZipCode: request.zipcode,
            Gender: request.gender,
            MaritalStatus: request.maritalstatus,
            Nationality: request.nationality,
            DateOfBirth: request.dateofbirth,
            Status: true,
            IsDeleted: false,
            AddedOn: new Date()
        });

        return success(res, "User created successfully", data);
    } catch (error) {
        console.error("createUser error:", error);
        return failed(res, error.message);
    }
};

exports.editUser = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            userid: 'required',
            firstname: 'required',
            lastname: 'required',
            emailid: 'required',
            mobile: 'required',
        });
        if (await v.fails()) return failedValidation(res, v);


        const user = await User.findOne({
            where: { UserID: request.userid, IsDeleted: false }
        });
        if (!user) return failed(res, "User not found");

        const duplicate = await User.findOne({
            where: {
                [Op.or]: [
                    { EmailID: request.emailid },
                    { Mobile: request.mobile }
                ],
                IsDeleted: false,
                UserID: { [Op.ne]: request.userid }
            }
        });

        if (duplicate) {
            return failed(res, "User already exists");
        }


        const updateData = {
            UserTypeID: request.usertypeid,
            FirstName: request.firstname,
            LastName: request.lastname,
            EmailID: request.emailid,
            UserName: request.username,
            Mobile: request.mobile,
            Address: request.address,
            City: request.city,
            StateID: request.stateid,
            ZipCode: request.zipcode,
            Gender: request.gender,
            MaritalStatus: request.maritalstatus,
            Nationality: request.nationality,
            DateOfBirth: request.dateofbirth
        };

        await User.update(updateData, { where: { UserID: request.userid } });

        return success(res, "User updated successfully.");
    } catch (error) {
        console.error("editUser error:", error);
        return failed(res, error.message);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            userid: 'required|integer'
        });
        if (await v.fails()) return failedValidation(res, v);

        const user = await User.findOne({
            where: { UserID: request.userid, IsDeleted: false }
        });
        if (!user) return failed(res, "User not found");

        await User.update({ IsDeleted: true }, { where: { UserID: request.userid } });

        return success(res, "User deleted successfully.");
    } catch (error) {
        console.error("deleteUser error:", error);
        return failed(res, error.message);
    }
};

exports.statusUser = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            userid: 'required|integer'
        });
        if (await v.fails()) return failedValidation(res, v);

        const user = await User.findOne({
            where: { UserID: request.userid, IsDeleted: false }
        });
        if (!user) return failed(res, "User not found");

        const newStatus = !user.Status;

        await User.update({ Status: newStatus }, { where: { UserID: request.userid } });

        return success(res, "User status updated successfully");
    } catch (error) {
        console.error("statusUser error:", error);
        return failed(res, error.message);
    }
};
exports.getUserDetails = async (req, res) => {
    try {
        const request = await decrypter(req.query);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            userid: 'required|integer'
        });
        if (await v.fails()) return failedValidation(res, v);

        const user = await User.findOne({
            where: { UserID: request.userid, IsDeleted: false },
            include: [
                {
                    model: State,
                    as: 'State',
                    attributes: ['StateID', 'StateName'],
                    required: false
                },
                {
                    model: UserType,     // tbl_usertypes model
                    as: 'usersType',
                    attributes: ['UserType'], // Role name
                    required: false
                }
            ]
        });

        if (!user) return failed(res, "User not found");

        // 👉 convert Role inside returned user object
        const userData = {
            ...user.dataValues,
            Role: user.usersType ? user.usersType.TypeName : null
        };

        return success(res, "User details fetched successfully", { user: userData });
    } catch (error) {
        console.error("getUserDetails error:", error);
        return failed(res, error.message);
    }
};

exports.listUsers = async (req, res) => {
    try {
        const request = await decrypter(req.query);
        if (!request) return failed(res, "Internal server error");


        let pageSize = request.limit ? parseInt(request.limit) : 10;
        let page = request.page ? parseInt(request.page) : 1;
        let offset = pageSize * (page - 1);
        let search = request.search ? request.search : "";

        // build where condition
        let whereCondition = { IsDeleted: false };

        if (search) {
            page = 1;
            offset = 0;
            whereCondition = {
                ...whereCondition,
                [Op.or]: [
                    { FirstName: { [Op.substring]: search } },
                    { LastName: { [Op.substring]: search } },
                    { EmailID: { [Op.substring]: search } },
                    { Mobile: { [Op.substring]: search } },
                    { Gender: { [Op.substring]: search } },
                    { '$usersType.UserType$': { [Op.substring]: search } }
                ]
            };
        }

        const users = await User.findAndCountAll({
            where: whereCondition,
            order: [['UserID', 'DESC']],
            limit: pageSize,
            offset: offset,
            include: [
                {
                    model: State,
                    as: 'State',
                    attributes: ['StateID', 'StateName'],
                    required: false
                },
                {
                    model: UserType,   // tbl_usertypes
                    as: 'usersType',
                    attributes: ['UserType'], // Role
                    required: false
                }
            ]
        });

        const finalUsers = users.rows.map(u => {
            const { usersType, ...rest } = u.dataValues; // remove nested usersType
            return {
                ...rest,
                Role: usersType ? usersType.UserType : null
            };
        });


        return success(res, "Users fetched successfully", {
            users: finalUsers,
            total: users.count,
            page: page,
            limit: pageSize
        });
    } catch (error) {
        console.error("Error in listUsers:", error);
        return failed(res, error.message);
    }
};



exports.listStates = async (req, res) => {
    try {
        const requests = await decrypter(req.query);
        if (!requests) return failed(res, "Internal server error");

        const states = await State.findAll({
            where: { IsDeleted: 0 },
            order: [['StateName', 'ASC']],
            attributes: ['StateID', 'StateName']
        });

        return success(res, "States fetched successfully", states);
    } catch (error) {
        console.log("listStates error:", error);
        return failed(res, error.message);
    }
};
