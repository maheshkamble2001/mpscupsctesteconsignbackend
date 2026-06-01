const MCQ = require("../../../../models").tbl_mcqtestquestions;
const { Op } = require("sequelize");
const { Validator } = require("node-input-validator");
const { decrypter } = require("../../../helper/crypto");
const { success, failed, failedValidation } = require("../../../helper/response");
const { tbl_examtype, tbl_subjects } = require("../../../../models");


// ✅ CREATE QUESTION
exports.createQuestion = async (req, res) => {
    try {
        const request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            Question: "required|string",
            Option1: "required|string",
            Option2: "required|string",
            Option3: "required|string",
            Option4: "required|string",
            CorrectOption: "required|string",
            ExamTypeId: "required|integer",
            SubjectId: "required|integer",
        });

        if (await v.fails()) return failedValidation(res, v);

        await MCQ.create({
            TestID: request.TestID,
            ExamTypeId: request.ExamTypeId,
            SubjectId: request.SubjectId,
            Question: request.Question,
            Option1: request.Option1,
            Option2: request.Option2,
            Option3: request.Option3,
            Option4: request.Option4,
            CorrectOption: request.CorrectOption,
            AnswerDesc: request.AnswerDesc,
            addedon: new Date(),
            isdeleted: 0,
        });

        return success(res, "Question created successfully");
    } catch (error) {
        console.error("createQuestion error:", error);
        return failed(res, error.message);
    }
};



// ✅ UPDATE QUESTION
exports.updateQuestion = async (req, res) => {
    try {
        const request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            QuestionID: "required",
            Question: "required|string",
            ExamTypeId: "required|integer",
            SubjectId: "required|integer",
        });

        if (await v.fails()) return failedValidation(res, v);

        const question = await MCQ.findOne({
            where: { QuestionID: request.QuestionID, isdeleted: 0 },
        });

        if (!question) return failed(res, "Question not found");

        await MCQ.update(
            {
                TestID: request.TestID,
                ExamTypeId: request.ExamTypeId,
                SubjectId: request.SubjectId,
                Question: request.Question,
                Option1: request.Option1,
                Option2: request.Option2,
                Option3: request.Option3,
                Option4: request.Option4,
                CorrectOption: request.CorrectOption,
                AnswerDesc: request.AnswerDesc,
            },
            { where: { QuestionID: request.QuestionID } }
        );

        return success(res, "Question updated successfully");
    } catch (error) {
        console.error("updateQuestion error:", error);
        return failed(res, error.message);
    }
};



// ✅ DELETE QUESTION (SOFT DELETE)
exports.deleteQuestion = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        if (!request || !request.QuestionID)
            return failed(res, "QuestionID is required");

        const question = await MCQ.findOne({
            where: { QuestionID: request.QuestionID, isdeleted: 0 },
        });

        if (!question) return failed(res, "Question not found");

        await MCQ.update(
            { isdeleted: 1 },
            { where: { QuestionID: request.QuestionID } }
        );

        return success(res, "Question deleted successfully");
    } catch (error) {
        console.error("deleteQuestion error:", error);
        return failed(res, error.message);
    }
};



exports.listQuestions = async (req, res) => {
    try {
        let request = {};
        try {
            request = (await decrypter(req.query)) || req.query;
        } catch {
            request = req.query;
        }

        const pageSize = request.limit ? parseInt(request.limit) : 10;
        const page = request.page ? parseInt(request.page) : 1;
        const offset = (page - 1) * pageSize;
        const search = request.search ? request.search : null;

        const whereCondition = { isdeleted: false };

        if (search) {
            whereCondition[Op.or] = [
                { Question: { [Op.substring]: search } },
                { Option1: { [Op.substring]: search } },
                { Option2: { [Op.substring]: search } },
                { Option3: { [Op.substring]: search } },
                { Option4: { [Op.substring]: search } },
            ];
        }

        if (request.ExamTypeId) {
            whereCondition.ExamTypeId = request.ExamTypeId;
        }

        if (request.SubjectId) {
            whereCondition.SubjectId = request.SubjectId;
        }

        if (request.status) {
            whereCondition.status = request.status;
        }

        const result = await MCQ.findAndCountAll({
            where: whereCondition,
            order: [["QuestionID", "DESC"]],
            limit: pageSize,
            offset,
            include: [
                {
                    model: tbl_examtype,
                    as: "ExamType",
                    attributes: ["id", "name"]
                },
                {
                    model: tbl_subjects,
                    as: "Subject",
                    attributes: ["SubjectID", "SubjectName"]
                }
            ]
        });

        return success(res, "Questions fetched successfully", {
            questions: result.rows,
            total: result.count,
            page,
            limit: pageSize,
        });
    } catch (error) {
        console.error("listQuestions error:", error);
        return failed(res, error.message);
    }
};