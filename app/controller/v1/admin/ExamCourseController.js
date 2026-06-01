const { tbl_examcourses: Course,
        tbl_coursecurriculum: Curriculum,
        tbl_coursecoupons: Coupon,
        tbl_exam: Exam } = require('../../../../models');

const { Op, Sequelize } = require("sequelize");
const { Validator } = require('node-input-validator');

const { success, failed, failedValidation } = require('../../../helper/response');
const { decrypter } = require('../../../helper/crypto');

exports.createCourse = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseTitle: 'required|string',
            ExamId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const course = await Course.create({
            ...requests,
            addedon: new Date(),
            isdeleted: 0
        });

        return success(res, "Course created", course);

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            CourseId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        await Course.update(requests, {
            where: { CourseId: requests.CourseId }
        });

        return success(res, "Course updated");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.listCourses = async (req, res) => {
    try {
        let requests = await decrypter(req.query) || req.query;

        const { rows, count } = await Course.findAndCountAll({
            where: { isdeleted: 0 },
            include: [{
                model: Exam,
                as: 'Exam',
                attributes: ['ExamId', 'ExamName']
            }],
            order: [['CourseId', 'DESC']]
        });

        return success(res, "Courses fetched", { rows, count });

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        await Course.update({ isdeleted: 1 }, {
            where: { CourseId: requests.CourseId }
        });

        return success(res, "Course deleted");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.addCurriculum = async (req, res) => {
    try {
        const requests = await decrypter(req.body);

        const data = requests.modules.map(m => ({
            CourseId: requests.CourseId,
            CourseCarriculam: m.section,
            ModuleName: m.name,
            Duration: m.duration
        }));

        await Curriculum.bulkCreate(data);

        return success(res, "Curriculum added");

    } catch (e) {
        return failed(res, e.message);
    }
};

