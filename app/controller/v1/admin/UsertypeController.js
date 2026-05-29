let Usertype = require('../../../../models').tbl_usertypes;
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

exports.createUserType = async function (req, res) {
    try {
        let data = {};

        var requests = await decrypter(req.body);
        if (requests == false) {
            return failed(res, "Internal server error");
        }

        const v = new Validator(requests, {
            usertype: 'required'
        });

        const matched = await v.check();
        if (!matched) {
            return failedValidation(res, v);
        }

        const duplicate = await Usertype.findOne({
            where: {
                UserType: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("UserType")),
                    requests.usertype.toLowerCase()
                ),
                IsDeleted: 0
            }

        });

        if (duplicate) {
            return failed(res, "User type already exists");
        }


        var reqData = {
            UserType: requests.usertype,
            Status: 1,
            IsDeleted: 0
        }

        data = await Usertype.create(reqData);

        return success(res, 'Success', data);
    } catch (error) {
        dump("error", error)
        return failed(res, error.message);
    }
}

exports.editUserType = async function (req, res) {
    try {
        let data = {};

        const requests = await decrypter(req.body);
        if (!requests) {
            return failed(res, "Internal server error");
        }

        const v = new Validator(requests, {
            usertypeid: 'required',
            usertype: 'required'
        });

        const matched = await v.check();
        if (!matched) {
            return failedValidation(res, v);
        }

        const existing = await Usertype.findOne({
            where: {
                UserTypeID: requests.usertypeid,
                IsDeleted: 0
            }
        });

        if (!existing) {
            return failed(res, "User type not found or already deleted");
        }

        const duplicate = await Usertype.findOne({
            where: {
                UserType: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("UserType")),
                    requests.usertype.toLowerCase()
                ),
                IsDeleted: 0,
                UserTypeID: { [Op.ne]: requests.usertypeid }
            }

        });

        if (duplicate) {
            return failed(res, "User type already exists");
        }


        const reqData = {
            UserType: requests.usertype,
            Status: 1,
            IsDeleted: 0
        };


        const updated = await Usertype.update(reqData, {
            where: { UserTypeID: requests.usertypeid }
        });

        return success(res, 'User type updated successfully', reqData);
    } catch (error) {
        return failed(res, error.message);
    }
}

exports.listUserTypes = async function (req, res) {
    try {
        const requests = await decrypter(req.query);
        if (!requests) return failed(res, "Internal server error");

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = { IsDeleted: 0 };

        if (search !== "") {
            whereClause[Op.or] = [
                { UserType: { [Op.substring]: search } }
            ];
        }

        const { rows: usertypes, count: totalRecords } = await Usertype.findAndCountAll({
            where: whereClause,
            attributes: ['UserTypeID', 'UserType', 'Status', 'AddedOn'],
            order: [['UserTypeID', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(totalRecords / limit);

        return success(res, 'User type list fetched successfully', {
            usertypes,
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

exports.listActiveUserTypes = async function (req, res) {
    try {
        const requests = await decrypter(req.query);
        if (!requests) return failed(res, "Internal server error");

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        const whereClause = {
            IsDeleted: 0,
            Status: 1
        };

        if (search !== "") {
            whereClause[Op.or] = [
                { UserType: { [Op.substring]: search } }
            ];
        }

        const { rows: usertypes, count: totalRecords } = await Usertype.findAndCountAll({
            where: whereClause,
            attributes: ['UserTypeID', 'UserType', 'Status', 'AddedOn'],
            order: [['UserTypeID', 'DESC']],
            limit,
            offset
        });

        if (!usertypes || usertypes.length === 0) {
            return failed(res, "Active user types not found");
        }

        const totalPages = Math.ceil(totalRecords / limit);

        return success(res, 'Active user type list fetched successfully', {
            usertypes,
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


exports.statusUserType = async function (req, res) {
    try {
        const requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            usertypeid: 'required|integer',
        });

        const matched = await v.check();
        if (!matched) return failedValidation(res, v);

        const userType = await Usertype.findOne({
            where: {
                UserTypeID: requests.usertypeid,
                IsDeleted: 0
            }
        });

        if (!userType) return failed(res, "User type not found");

        const currentStatus = userType.Status;
        const updatedStatus = currentStatus === 1 ? 0 : 1;

        const [updated] = await Usertype.update(
            { Status: updatedStatus },
            { where: { UserTypeID: requests.usertypeid } }
        );

        if (updated === 0) {
            return failed(res, "Status not updated. Maybe already same or invalid.");
        }

        return success(res, `User type status changed`);
    } catch (error) {
        return failed(res, error.message);
    }
};

exports.deleteUserType = async function (req, res) {
    try {

        const requests = await decrypter(req.body);
        if (!requests) {
            return failed(res, "Internal server error");
        }

        const v = new Validator(requests, {
            usertypeid: 'required',
        });

        const matched = await v.check();
        if (!matched) {
            return failedValidation(res, v);
        }

        const userType = await Usertype.findOne({
            where: {
                UserTypeID: requests.usertypeid,
                IsDeleted: 0
            }
        });

        if (!userType) {
            return failed(res, "User type not found or already deleted");
        }

        await Usertype.update(
            { IsDeleted: 1 },
            {
                where: {
                    UserTypeID: requests.usertypeid
                }
            }
        );

        return success(res, "User type deleted successfully");
    } catch (error) {
        return failed(res, error.message);
    }
};
