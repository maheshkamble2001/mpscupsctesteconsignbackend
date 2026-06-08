const UpcomingExam = require("../../../../models").tbl_upcomingexams;
const { Op } = require("sequelize");
const { Validator } = require("node-input-validator");
const { decrypter } = require("../../../helper/crypto");
const {
    success,
    failed,
    failedValidation,
} = require("../../../helper/response");
let { v4 } = require("uuid");

exports.addUpcomingExam = async (req, res) => {
    try {
        let request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            ExamTitle: "required|string",
            ApplicationStartDate: "required",
            ApplicationEndDate: "required",
        });

        if (await v.fails()) return failedValidation(res, v);

        const isExam = await UpcomingExam.findOne({
            where: {
                ExamTitle: request.ExamTitle,
                ApplicationStartDate: request.ApplicationStartDate,
            },
        });

        if (isExam) return failed(res, "Exam already exists");

        const examData = {
            ExamTitle: request.ExamTitle,
            Organization: request.Organization,
            Category: request.Category,
            ExamType: request.ExamType,
            StateId: request.StateId,

            NotificationDate: request.NotificationDate,
            ApplicationStartDate: request.ApplicationStartDate,
            ApplicationEndDate: request.ApplicationEndDate,
            ExamDate: request.ExamDate,

            Eligibility: request.Eligibility,
            Description: request.Description,
            OfficialURL: request.OfficialURL,
            SyllabusURL: request.SyllabusURL,

            Status: "UPCOMING",
            IsActive: 1,
            IsDeleted: 0,
            AddedOn: new Date(),
        };

        await UpcomingExam.create(examData);

        return success(res, "Exam created successfully");
    } catch (error) {
        console.error("addUpcomingExam error:", error);
        return failed(res, error.message);
    }
};

exports.updateUpcomingExam = async (req, res) => {
    try {
        let request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        const v = new Validator(request, {
            ExamId: "required",
            ExamTitle: "required|string",
        });

        if (await v.fails()) return failedValidation(res, v);

        const exam = await UpcomingExam.findOne({
            where: { ExamID: request.ExamId, IsDeleted: 0 },
        });

        if (!exam) return failed(res, "Exam not found");
        const payload = {
                ExamTitle: request.ExamTitle,
                Organization: request.Organization,
                Category: request.Category,
                ExamType: request.ExamType,
                StateId: request.StateId,

                NotificationDate: request.NotificationDate,
                ApplicationStartDate: request.ApplicationStartDate,
                ApplicationEndDate: request.ApplicationEndDate,
                ExamDate: request.ExamDate,

                Eligibility: request.Eligibility,
                Description: request.Description,
                OfficialURL: request.OfficialURL,
                SyllabusURL: request.SyllabusURL,

                UpdatedOn: new Date(),
            }
        await UpcomingExam.update(
            payload,
            {
                where: { ExamID: request.ExamId },
            }
        );

        return success(res, "Exam updated successfully");
    } catch (error) {
        console.error("updateUpcomingExam error:", error);
        return failed(res, error.message);
    }
};

exports.listUpcomingExams = async (req, res) => {
    try {
        let request = {};
        try {
            request = (await decrypter(req.query)) || req.query;
        } catch {
            request = req.query;
        }

        let pageSize = request.limit ? parseInt(request.limit) : 10;
        let page = request.page ? parseInt(request.page) : 1;
        let offset = pageSize * (page - 1);
        let search = request.search || "";

        let whereCondition = {
            IsDeleted: 0,
        };

        if (search) {
            whereCondition[Op.or] = [
                { ExamTitle: { [Op.substring]: search } },
                { Organization: { [Op.substring]: search } },
            ];
        }

        if (request.status) whereCondition.Status = request.status;
        if (request.examType) whereCondition.ExamType = request.examType;

        const exams = await UpcomingExam.findAndCountAll({
            where: whereCondition,
            order: [["AddedOn", "DESC"]],
            // limit: pageSize,
            // offset: offset,
        });

        return success(res, "Exams fetched successfully", {
            exams: exams.rows,
            total: exams.count,
            page,
            limit: pageSize,
        });
    } catch (error) {
        console.error("listUpcomingExams error:", error);
        return failed(res, error.message);
    }
};

exports.deleteUpcomingExam = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        if (!request.examId) return failed(res, "ExamID is required");

        const exam = await UpcomingExam.findOne({
            where: { ExamID: request.ExamId, IsDeleted: 0 },
        });

        if (!exam) return failed(res, "Exam not found");

        await UpcomingExam.update(
            { IsDeleted: 1 },
            { where: { ExamID: request.ExamId } }
        );

        return success(res, "Exam deleted successfully");
    } catch (error) {
        console.error("deleteUpcomingExam error:", error);
        return failed(res, error.message);
    }
};

exports.updateExamStatus = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            ExamId: "required",
            Status: "required",
        });

        if (await v.fails()) return failedValidation(res, v);

        const exam = await UpcomingExam.findOne({
            where: { ExamID: request.ExamId, IsDeleted: 0 },
        });

        if (!exam) return failed(res, "Exam not found");

        await UpcomingExam.update(
            { Status: request.Status },
            { where: { ExamID: request.ExamId } }
        );

        return success(res, "Status updated successfully");
    } catch (error) {
        console.error("updateExamStatus error:", error);
        return failed(res, error.message);
    }
};

exports.getOpenExams = async (req, res) => {
    try {
        const exams = await UpcomingExam.findAll({
            where: {
                Status: "OPEN",
                IsDeleted: 0,
                IsActive: 1,
            },
            order: [["ApplicationEndDate", "ASC"]],
        });

        return success(res, "Open exams fetched", { exams });
    } catch (error) {
        return failed(res, error.message);
    }
};

exports.listUpcomingExams = async (req, res) => {
    try {
        let request = {};
        try {
            request = (await decrypter(req.query)) || req.query;
        } catch {
            request = req.query;
        }

        // ✅ Pagination Params
        let page = parseInt(request.page) || 1;
        let limit = parseInt(request.limit) || 10;

        // Safety check
        if (page < 1) page = 1;
        if (limit < 1 || limit > 100) limit = 10;

        let offset = (page - 1) * limit;

        let search = request.search || "";

        // ✅ Where condition
        let whereCondition = {
            IsDeleted: 0,
        };

        // ✅ Search
        if (search) {
            whereCondition[Op.or] = [
                { ExamTitle: { [Op.substring]: search } },
                { Organization: { [Op.substring]: search } },
            ];
        }

        // ✅ Filters
        if (request.status) whereCondition.Status = request.status;
        if (request.examType) whereCondition.ExamType = request.examType;

        // ✅ Query
        const exams = await UpcomingExam.findAndCountAll({
            where: whereCondition,
            order: [["AddedOn", "DESC"]],
            limit: limit,
            offset: offset,
        });

        // ✅ Pagination Response
        return success(res, "Exams fetched successfully", {
            data: exams.rows,
            pagination: {
                totalRecords: exams.count,
                totalPages: Math.ceil(exams.count / limit),
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (error) {
        console.error("listUpcomingExams error:", error);
        return failed(res, error.message);
    }
};