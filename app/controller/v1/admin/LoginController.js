let Admin = require('../../../../models').tbl_adminusers;
let Roles = require('../../../../models').tbl_usertypes;
let RoleAccess = require('../../../../models').tbl_roleaccess;
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
    decrypter, passwordEncrypter, dotNetPasswordEncrypt, dotNetPasswordDecrypt,
    dotNetPasswordencryptor
} = require('../../../helper/crypto');
const {
    mail
} = require('../../../helper/mail');
const admin = require('../../../helper/adminAuth');
const {
    fn,
    col
} = require('../../../../models').sequelize

exports.login = async function (req, res) {
    try {
        var requests = await decrypter(req.body);

        if (requests == false) {
            return failed(res, "Internal server error");
        }

        const v = new Validator(requests, {
            username: 'required',
            password: 'required'
        });

        const matched = await v.check();
        if (!matched) {
            return failedValidation(res, v);
        }

        let user = await Admin.findOne({
            where: {
                EmailID: requests.username,
            },
            attributes: [
                'Password',
                'UserID',
                'FirstName',
                'LastName',
                'EmailID',
                'UserTypeID',
                'Status',
                'IsDeleted'
            ],
            include: [{
                model: Roles,
                as: "usersType",
                include: [{
                    model: RoleAccess,
                    as: "RoleAccess"
                }]
            }]
        });

        if (!user || user.dataValues.IsDeleted == 1)
            return failed(res, "User not found");

        if (user.dataValues.Status == 0) {
            return failed(res, "Your account is inactive, please contact admin");
        }

        // RoleAccess extract
        let userAccessIds = user.dataValues.usersType?.RoleAccess || [];
        const userAccessIdsArr = userAccessIds.map(item => item.access_code);
        const password = user.dataValues.Password||user.Password ||"";
        // Plain Password Check (NO .NET ENCRYPTION)
        if (requests.password !== password) {
            return failed(res, "Invalid Password.");
        }

        const token = await jwt.createToken({
            data: user.dataValues.UserID,
            roleId: user.dataValues.UserTypeID,
        });

        const data = {
            access_token: token,
            token_type: 'Bearer',
            expires_in: jwtConfig.ttl,
            firstname: user.dataValues.FirstName,
            lastname: user.dataValues.LastName,
            email: user.dataValues.EmailID,
            roleId: user.dataValues.UserTypeID,
            roleName: user.dataValues.usersType?.UserType,
            roleAccess: userAccessIdsArr
        };

        return success(res, 'Success', data);

    } catch (error) {
        return failed(res, error.message);
    }
};


exports.forgotPassword = async function (req, res) {
    try {

        var requests = await decrypter(req.body);

        if (requests == false) {
            return failed(res, "Internal server error");
        }

        // Validate the request data: check that the 'email' field is provided
        const v = new Validator(requests, {
            email: 'required|email',
        });

        const matched = await v.check();

        // If validation fails, return an error
        if (!matched) {
            return failedValidation(res, v);
        }

        // Find the user by emailid in the database
        let user = await Admin.findOne({
            where: {
                EmailID: requests.email,
                Status: 1
            }
        });

        var data = {};

        // If the user exists
        if (user) {
            // Generate the reset password URL
            let url = process.env.ADMIN_RESET_PASSWORD + user.dataValues.UserID;

            // Prepare the mail data for sending the reset link via email
            var mailData = {
                email: user.dataValues.EmailID,
                subject: "Change Password Request",
                text: url,
                html: `<a href="${url}" target="__blank">Click Here to Reset Password</a>`,
            };

            // Call the mail function to send the email with the reset link
            mail(mailData);

        } else {
            // If the user is not found, return an error
            return failed(res, "Invalid Email.");
        }

        // Return a success response
        return success(res, 'Success', data);
    } catch (error) {
        // Catch any errors and return a failure response
        return failed(res, error.message);
    }
}



exports.resetPasword = async function (req, res) {
    try {

        var requests = await decrypter(req.body);

        if (requests == false) {
            return failed(res, "Internal server error");
        }
        dump({ requests })
        const v = new Validator(requests, {
            key: 'required',
            password: 'required|same:confirmPassword'
        });

        const matched = await v.check();

        if (!matched) {
            return failedValidation(res, v);
        }

        const user = await Admin.findOne({
            where: {
                UserID: requests.key
            }
        });

        var data = {}

        if (user) {
            let encPass = await dotNetPasswordEncrypt(requests.password)
            dump({ encPass })
            await Admin.update({
                Password: encPass
            }, {
                where: {
                    UserID: requests.key
                }
            });
        } else {
            return failed(res, "Invalid Key.");
        }

        return success(res, 'Success', data);
    } catch (error) {
        return failed(res, error.message);
    }
}

exports.changePassword = async function (req, res) {
    try {

        var requests = await decrypter(req.body);

        if (requests == false) {
            return failed(res, "Internal server error");
        }

        const v = new Validator(requests, {
            password: "required",
            newPassword: 'required|same:confirmPassword',
            confirmPassword: 'required'
        });

        const matched = await v.check();

        if (!matched) {
            return failedValidation(res, v);
        }

        let userData = await admin(req);

        const user = await Admin.findOne({
            where: {
                UserID: userData.dataValues.UserID
            }
        });

        if (!user) {
            return failed(res, "User not found.");
        }
        //  Plain Text Comparison — No Encryption Now
        if (user.dataValues.Password !== requests.password) {
            return failed(res, "Invalid password.");
        }

        //  Save New Password as Plain (no encryption)
        await Admin.update(
            { Password: requests.newPassword },
            { where: { UserID: userData.dataValues.UserID } }
        );

        return success(res, 'Success', {});

    } catch (error) {
        return failed(res, error.message);
    }
};
