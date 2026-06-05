const { tbl_examtests: Test,
    tbl_testquestions: TestQuestion,
    tbl_subjects: Subject,
    tbl_exam: Exam } = require('../../../../models');

const { Op, Sequelize } = require("sequelize");
const { Validator } = require('node-input-validator');

const { success, failed, failedValidation } = require('../../../helper/response');
const { decrypter } = require('../../../helper/crypto');
const path = require('path');

exports.createTest = async (req, res) => {

    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            TestName: 'required|string',
            TestType: 'required|string',
            ExamId: 'required|integer',
            Duration: 'required|integer',
            subjects: 'required|array'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check exam
        const isExamExist = await Exam.findOne({
            where: { ExamId: requests.ExamId }
        });
        if (!isExamExist) return failed(res, "Exam not found");

        // ❗ subjects validation
        if (!requests.subjects.length) {
            return failed(res, "At least one subject is required");
        }

        // ❗ Validate subjects
        const subjectIds = new Set();

        for (let s of requests.subjects) {
            if (!s.SubjectId || !s.questionCount) {
                return failed(res, "Invalid subject data");
            }

            if (subjectIds.has(s.SubjectId)) {
                return failed(res, `Duplicate SubjectId: ${s.SubjectId}`);
            }

            subjectIds.add(s.SubjectId);
        }

        // ✅ Calculate total questions
        const totalQuestions = requests.subjects.reduce(
            (sum, s) => sum + Number(s.questionCount),
            0
        );

        // ✅ Create test
        const test = await Test.create({
            ...requests,
            noOfQuestions: totalQuestions,
            languages: requests.languages,
            addedOn: new Date(),
            isDeleted: 0
        });

        // ✅ Prepare bulk insert
        const questionData = requests.subjects.map(s => ({
            TestId: test.TestId,
            SubjectId: s.SubjectId,
            questionCount: s.questionCount,
            addedOn: new Date()
        }));

        await TestQuestion.bulkCreate(questionData);

        return success(res, "Test created with subjects successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateTest = async (req, res) => {

    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            TestId: 'required|integer',
            TestName: 'required|string',
            TestType: 'required|string',
            ExamId: 'required|integer',
            subjects: 'required|array'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check test exists
        const existingTest = await Test.findOne({
            where: { TestId: requests.TestId }
        });
        if (!existingTest) return failed(res, "Test not found");

        // ✅ Validate subjects
        const subjectIds = new Set();

        for (let s of requests.subjects) {
            if (!s.SubjectId || !s.questionCount) {
                return failed(res, "Invalid subject data");
            }

            if (subjectIds.has(s.SubjectId)) {
                return failed(res, `Duplicate SubjectId: ${s.SubjectId}`);
            }

            subjectIds.add(s.SubjectId);
        }

        // ✅ Calculate total questions
        const totalQuestions = requests.subjects.reduce(
            (sum, s) => sum + Number(s.questionCount),
            0
        );

        // ✅ Update test
        await Test.update({
            ...requests,
            noOfQuestions: totalQuestions,
            languages: requests.languages
        }, {
            where: { TestId: requests.TestId }
        });

        // 🔥 STEP 1: Get existing subjects
        const existingSubjects = await TestQuestion.findAll({
            where: { TestId: requests.TestId }
        });

        const existingMap = new Map();
        existingSubjects.forEach(item => {
            existingMap.set(item.SubjectId, item);
        });

        const newSubjectIds = requests.subjects.map(s => s.SubjectId);

        // 🔥 STEP 2: DELETE removed subjects
        for (let old of existingSubjects) {
            if (!newSubjectIds.includes(old.SubjectId)) {
                await TestQuestion.destroy({
                    where: { id: old.id }
                });
            }
        }

        // 🔥 STEP 3: INSERT / UPDATE
        for (let s of requests.subjects) {

            if (existingMap.has(s.SubjectId)) {
                // ✅ UPDATE
                await TestQuestion.update({
                    questionCount: s.questionCount
                }, {
                    where: {
                        TestId: requests.TestId,
                        SubjectId: s.SubjectId
                    }
                });

            } else {
                // ✅ INSERT
                await TestQuestion.create({
                    TestId: requests.TestId,
                    SubjectId: s.SubjectId,
                    questionCount: s.questionCount,
                    addedOn: new Date()
                });
            }
        }


        return success(res, "Test updated successfully");

    } catch (e) {
        await t.rollback();
        return failed(res, e.message);
    }
};

exports.listTests = async (req, res) => {
    try {
        let requests = await decrypter(req.query) || req.query;

        const search = requests.search?.trim() || "";
        const page = parseInt(requests.page) || 1;
        const limit = parseInt(requests.limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = { isDeleted: 0 };

        if (search !== "") {
            whereClause[Op.or] = [
                { TestName: { [Op.substring]: search } },
                { TestType: { [Op.substring]: search } }
            ];
        }

        const { rows, count } = await Test.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Exam,
                    as: 'Exam',
                    attributes: ['ExamId', 'ExamName']
                },
                {
                    model: TestQuestion,
                    as: 'TestQuestions',
                    attributes: ['id', 'SubjectId', 'questionCount'],
                    include: [
                        {
                            model: Subject,
                            as: 'Subject',
                            attributes: ['SubjectID', 'SubjectName']
                        }
                    ]
                }
            ],
            order: [['TestId', 'DESC']],
            distinct: true,
            limit,
            offset
        });

        // ✅ Format response
        const updatedRows = rows.map(test => {
            const data = test.toJSON();

            return {
                ...data,

                // 🔁 Convert languages string → array
                languages: data.languages
                    ? data.languages.split(',')
                    : [],

                // 🔁 Rename for frontend clarity
                subjects: data.TestQuestions || []
            };
        });

        return success(res, "Tests fetched successfully", {
            rows: updatedRows,
            count
        });

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.deleteTest = async (req, res) => {

    try {
        const requests = await decrypter(req.body);

        const v = new Validator(requests, {
            TestId: 'required|integer'
        });

        if (!(await v.check())) return failedValidation(res, v);

        // ✅ Check test exists
        const test = await Test.findOne({
            where: { TestId: requests.TestId }
        });

        if (!test) return failed(res, "Test not found");

        if (test.isDeleted) {
            return failed(res, "Test already deleted");
        }

        // ✅ Soft delete test
        await Test.update(
            { isDeleted: 1 },
            { where: { TestId: requests.TestId } }
        );

        // ✅ Delete related subjects (questions config)
        await TestQuestion.destroy({
            where: { TestId: requests.TestId }
        });


        return success(res, "Test deleted successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};

exports.updateIsShuffleStatus = async (req, res) => {

    try {
        const requests = await decrypter(req.body);
        const v = new Validator(requests, {
            TestId: 'required|integer',
            status:"required"
        });
        const status = requests.status;
        const test = await Test.findOne({
            where: { TestId: requests.TestId }
        });

        if (!test) return failed(res, "Test not found");

        if (!(await v.check())) return failedValidation(res, v);

        let data = {}

        if(status=="isShuffle"){
            data ={...data,isShuffle:!test?.dataValues?.isShuffle||!test?.isShuffle}
        }
        if(status=="isAnswerShuffle"){
            data ={...data,isAnswerShuffle:!test?.dataValues?.isAnswerShuffle||!test?.isAnswerShuffle}
        }
        if(status=="isAllowReview"){
            data ={...data,isAllowReview:!test?.dataValues?.isAllowReview||!test?.isAllowReview}
            
        }
        if(status=="isShowWarningTimer"){
            data ={...data,isShowWarningTimer:!test?.dataValues?.isShowWarningTimer||!test?.isShowWarningTimer}
            
        }
        if(status=="isDisableRightClick"){
            data ={...data,isDisableRightClick:!test?.dataValues?.isDisableRightClick||!test?.isDisableRightClick}
        }
        // ✅ Check test exists

        if (test.isDeleted) {
            return failed(res, "Test already deleted");
        }

        // ✅ Soft delete test
        await Test.update(
            { ...data },
            { where: { TestId: requests.TestId } }
        );


        return success(res, "Test status updated successfully");

    } catch (e) {
        return failed(res, e.message);
    }
};