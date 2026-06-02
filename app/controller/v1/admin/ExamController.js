let ExamSubjects = require('../../../../models').tbl_examsubjects;
let ExamType = require('../../../../models').tbl_examtype;
let Exam = require('../../../../models').tbl_exam;
let Subjects = require('../../../../models').tbl_subjects;

const { Op, Sequelize } = require("sequelize");
const { Validator } = require('node-input-validator');

const { success, failed, failedValidation } = require('../../../helper/response');
const { decrypter } = require('../../../helper/crypto');


// ✅ CREATE Exam Subject Mapping
exports.createExamSubject = async function (req, res) {
    try {
        let requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            ExamId: 'required|integer',
            SubjectId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // 🔥 Prevent duplicate mapping
        const duplicate = await ExamSubjects.findOne({
            where: {
                ExamId: requests.ExamId,
                SubjectId: requests.SubjectId,
                isdeleted: 0
            }
        });

        if (duplicate) return failed(res, "Mapping already exists");

        const data = await ExamSubjects.create({
            ExamId: requests.ExamId,
            SubjectId: requests.SubjectId,
            addedon: new Date(),
            isdeleted: 0
        });

        return success(res, "Exam subject created successfully", data);

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.createExam = async function (req, res) {
    const transaction = await Exam.sequelize.transaction();

    try {
        let requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            ExamName: 'required|string',
            ExamShortName: 'string',
            ExamTypeId: 'required|integer',
            Subjects: 'required|array|minLength:1'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // 🔥 Duplicate check
        const duplicate = await Exam.findOne({
            where: {
                ExamName: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("ExamName")),
                    requests.ExamName.toLowerCase()
                ),
                isdeleted: 0
            }
        });

        if (duplicate) return failed(res, "Exam already exists");

        const duplicateShortName = await Exam.findOne({
            where: {
                ExamShortName: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("ExamShortName")),
                    requests.ExamShortName.toLowerCase()
                ),
                isdeleted: 0
            }
        });

        if (duplicateShortName) return failed(res, "Exam short name already exists");

        const subjects = await Subjects.count({
            where: {
                SubjectID: requests.Subjects
            }
        });

        if (subjects != requests.Subjects.length) {
            return failed(res, "Invalid subject IDs");
        }

        // ✅ Create Exam
        const exam = await Exam.create({
            ExamName: requests.ExamName,
            ExamShortName: requests.ExamShortName,
            ExamTypeId: requests.ExamTypeId,
            Stage: requests.Stage,
            Duration: requests.Duration,
            TotalMarks: requests.TotalMarks,
            TotalQuestions: requests.TotalQuestions,
            MarkPerCorrect: requests.MarkPerCorrect,
            NegativeMark: requests.NegativeMark,
            CuttOff: requests.CuttOff,
            ExamMedium: requests.ExamMedium,
            addedon: new Date(),
            isdeleted: 0
        });

        // ✅ Insert Subjects Mapping
        const subjectData = requests.Subjects?.map(subjectId => ({
            ExamId: exam.ExamId,
            SubjectId: subjectId,
            addedon: new Date(),
            isdeleted: 0
        }));

        if (subjectData && subjectData.length > 0) {
            await ExamSubjects.bulkCreate(subjectData);
        }
        return success(res, "Exam created successfully", exam);

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.updateExam = async function (req, res) {

    try {
        let requests = await decrypter(req.body);
        if (!requests) return failed(res, "Internal server error");

        const v = new Validator(requests, {
            ExamId: 'required|integer',
            ExamName: 'required|string',
            ExamShortName: 'string',
            ExamTypeId: 'required|integer',
            Subjects: 'required|array|minLength:1'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check exam exists
        const exam = await Exam.findOne({
            where: { ExamId: requests.ExamId, isdeleted: 0 }
        });

        if (!exam) return failed(res, "Exam not found");

        // ✅ Duplicate name check
        const duplicate = await Exam.findOne({
            where: {
                ExamName: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("ExamName")),
                    requests.ExamName.toLowerCase()
                ),
                ExamId: { [Op.ne]: requests.ExamId },
                isdeleted: 0
            }
        });

        if (duplicate) return failed(res, "Exam already exists");

        // ✅ Safe short name check
        if (requests.ExamShortName) {
            const duplicateShortName = await Exam.findOne({
                where: {
                    ExamShortName: Sequelize.where(
                        Sequelize.fn("LOWER", Sequelize.col("ExamShortName")),
                        requests.ExamShortName.toLowerCase()
                    ),
                    ExamId: { [Op.ne]: requests.ExamId },
                    isdeleted: 0
                }
            });

            if (duplicateShortName)
                return failed(res, "Exam short name already exists");
        }

        // ✅ Validate subjects
        const subjectsCount = await Subjects.count({
            where: { SubjectID: requests.Subjects }
        });

        if (subjectsCount !== requests.Subjects.length) {
            return failed(res, "Invalid subject IDs");
        }

        // ✅ Remove duplicates
        const newSubjects = [...new Set(requests.Subjects)];

        // ✅ Update exam
        await Exam.update({
            ExamName: requests.ExamName,
            ExamShortName: requests.ExamShortName,
            ExamTypeId: requests.ExamTypeId,
            Stage: requests.Stage,
            Duration: requests.Duration,
            TotalMarks: requests.TotalMarks,
            TotalQuestions: requests.TotalQuestions,
            MarkPerCorrect: requests.MarkPerCorrect,
            NegativeMark: requests.NegativeMark,
            CuttOff: requests.CuttOff,
            ExamMedium: requests.ExamMedium
        }, {
            where: { ExamId: requests.ExamId },
        });

        const existingMappings = await ExamSubjects.findAll({
            where: {
                ExamId: requests.ExamId,
                isdeleted: 0
            },
        });

        const existingSubjects = existingMappings.map(i => i.SubjectId);

        const toAdd = newSubjects.filter(id => !existingSubjects.includes(id));

        const toRemove = existingSubjects.filter(id => !newSubjects.includes(id));

        if (toAdd.length > 0) {
            const insertData = toAdd.map(subjectId => ({
                ExamId: requests.ExamId,
                SubjectId: subjectId,
                addedon: new Date(),
                isdeleted: 0
            }));

            await ExamSubjects.bulkCreate(insertData);
        }

        if (toRemove.length > 0) {
            await ExamSubjects.update(
                { isdeleted: 1 },
                {
                    where: {
                        ExamId: requests.ExamId,
                        SubjectId: toRemove
                    },
                }
            );
        }

        return success(res, "Exam updated successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.listExams = async function (req, res) {
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
                { ExamName: { [Op.substring]: search } },
                { ExamShortName: { [Op.substring]: search } },
                // { '$ExamType.name$': { [Op.substring]: search } }
            ];
        }

        const { rows, count } = await Exam.findAndCountAll({
            where: whereClause,
            distinct: true, // ✅ FIX duplicate count
            col: 'ExamId',

            include: [
                {
                    model: ExamType,
                    as: 'ExamType',
                    attributes: ['id', 'name'],
                    where: search ? {
                        name: { [Op.substring]: search }
                    } : undefined,
                    required: false
                },
                {
                    model: Subjects,
                    as: 'Subjects',
                    attributes: ['SubjectID', 'SubjectName'],
                    through: { attributes: [] }
                }
            ],

            order: [["ExamId", "DESC"]],
            limit,
            offset
        });

        // ✅ Flatten subjects
        const formattedData = rows?.map(exam => {
            const subjects = exam.ExamSubjects?.map(es => es.Subject);

            return {
                ...exam.toJSON(),
                Subjects: subjects
            };
        });

        return success(res, "Exam list fetched successfully", {
            exams: rows,
            pagination: {
                totalRecords: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            }
        });

    } catch (error) {
        console.error("Error fetching exams:", error);
        return failed(res, error.message);
    }
};

exports.deleteExam = async function (req, res) {
    try {
        let requests = await decrypter(req.body);

        const v = new Validator(requests, {
            ExamId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const exam = await Exam.findOne({
            where: { ExamId: requests.ExamId, isdeleted: 0 }
        });

        if (!exam) return failed(res, "Exam not found");

        await Exam.update(
            { isdeleted: 1 },
            { where: { ExamId: requests.ExamId } }
        );

        return success(res, "Exam deleted successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.toggleShowInCatalogue = async function (req, res) {
    try {
        let requests = await decrypter(req.body);

        const v = new Validator(requests, {
            ExamId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const exam = await Exam.findOne({
            where: { ExamId: requests.ExamId, isdeleted: 0 }
        });

        if (!exam) return failed(res, "Exam not found");

        await Exam.update({
            ShowInCatalogue: !exam.ShowInCatalogue
        }, {
            where: { ExamId: requests.ExamId }
        });

        return success(res, "Show In Catalogue updated successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.toggleAllFreeTrial = async function (req, res) {
    try {
        let requests = await decrypter(req.body);

        const v = new Validator(requests, {
            ExamId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const exam = await Exam.findOne({
            where: { ExamId: requests.ExamId, isdeleted: 0 }
        });

        if (!exam) return failed(res, "Exam not found");

        await Exam.update({
            AllFreeTrial: !exam.AllFreeTrial
        }, {
            where: { ExamId: requests.ExamId }
        });

        return success(res, "Free Trial updated successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.toggleOpenEnrollment = async function (req, res) {
    try {
        let requests = await decrypter(req.body);

        const v = new Validator(requests, {
            ExamId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        const exam = await Exam.findOne({
            where: { ExamId: requests.ExamId, isdeleted: 0 }
        });

        if (!exam) return failed(res, "Exam not found");

        await Exam.update({
            OpenEnrollment: !exam.OpenEnrollment
        }, {
            where: { ExamId: requests.ExamId }
        });

        return success(res, "Open Enrollment updated successfully");

    } catch (error) {
        return failed(res, error.message);
    }
};

exports.examDropdown = async function (req, res) {
    try {
        const exams = await Exam.findAll({
            where: { isdeleted: 0 },
            attributes: ['ExamId', 'ExamName'],
            order: [['ExamName', 'ASC']]
        });
        return success(res, "Exam dropdown fetched successfully", exams);

    } catch (error) {
        return failed(res, error.message);
    }
};