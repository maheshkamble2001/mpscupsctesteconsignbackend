let TestType = require('../../../../models').tbl_testtypes;
let Tests = require('../../../../models').tbl_tests;
let TestLanguages = require('../../../../models').tbl_testlanguages;
let ExamType = require('../../../../models').tbl_examtype;
let Languages = require('../../../../models').tbl_languages;
let McqTestQuestion = require('../../../../models').tbl_mcqtestquestions;
const {
    Op,
    where,
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
const fs = require('fs');
const { image } = require('pdfkit');


exports.createTest = async (req, res) => {
    try {
        let request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        // ==== FIX: normalize languages if single ====
        if (request.languages && !Array.isArray(request.languages)) {
            request.languages = [request.languages];
        }

        // ========= VALIDATION =========
        const v = new Validator(request, {
            testtitle: 'required',
            testtypeid: 'required|integer',
            totalmarks: 'required|integer',
            duration: 'required',
            examtypeid: 'required|integer',
            languages: 'required|array', // <-- validate languages array
        });

        if (await v.fails()) {
            return failedValidation(res, v);
        }

        // ========= PDF HANDLER =========
        let testPaperPdf = null;
        let modelAnswerPdf = null;

        const uploadDir = "uploadDocs";
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const allowedTypes = ["application/pdf"];

        // ---- Test Paper PDF ----
        const testPaperFile = req.files?.testpaperpdf;
        if (testPaperFile) {
            if (!allowedTypes.includes(testPaperFile.mimetype)) {
                return failed(res, "Only PDF allowed for Test Paper");
            }

            const fileName = `${Date.now()}-${testPaperFile.name.replace(/\s+/g, "_")}`;
            const filePath = `${uploadDir}/${fileName}`;
            await testPaperFile.mv(filePath);
            testPaperPdf = filePath;
        }

        // ---- Model Answer PDF ----
        const modelAnswerFile = req.files?.modelanswerpdf;
        if (modelAnswerFile) {
            if (!allowedTypes.includes(modelAnswerFile.mimetype)) {
                return failed(res, "Only PDF allowed for Model Answer");
            }

            const fileName = `${Date.now()}-${modelAnswerFile.name.replace(/\s+/g, "_")}`;
            const filePath = `${uploadDir}/${fileName}`;
            await modelAnswerFile.mv(filePath);
            modelAnswerPdf = filePath;
        }

        // ========= INSERT RECORD =========
        const testData = await Tests.create({
            TestTitle: request.testtitle,
            TestTypeID: request.testtypeid,
            ExamTypeID: request.examtypeid,
            TotalMarks: request.totalmarks,
            TotalQuestions: request.totalquestions,
            TestPaperPdf: testPaperPdf,
            ModelAnswerPdf: modelAnswerPdf,
            Status: 1,
            Syllabus: request.syllabus,
            TargetYear: request.targetyear || null,
            TeacherName: request.teachername,
            Duration: request.duration,
            PositiveMarks: request.positivemarks,
            NegativeMarks: request.negativemarks,
            Description: request.description,
            IsDeleted: 0,
            AddedOn: new Date()
        });

        // ========= INSERT LANGUAGES =========
        if (Array.isArray(request.languages) && request.languages.length > 0) {
            const languageRecords = request.languages.map(langId => ({
                TestID: testData.TestID,
                LanguageID: langId,
                AddedOn: new Date()
            }));

            await TestLanguages.bulkCreate(languageRecords);
        }

        return success(res, "Test created successfully", testData);

    } catch (error) {
        console.error("createTest error:", error);
        return failed(res, error.message);
    }
};

exports.editTest = async (req, res) => {
    try {
        let request = await decrypter(req.body);
        if (!request) return failed(res, "Internal server error");

        // ==== FIX: normalize languages ====
        if (request.languages && !Array.isArray(request.languages)) {
            request.languages = [request.languages];
        }
        request.languages = request.languages?.map(Number).filter(n => !isNaN(n)) || [];

        // ========= VALIDATION =========
        const v = new Validator(request, {
            testid: 'required|integer',
            testtitle: 'required',
            testtypeid: 'required|integer',
            examtypeid: 'required|integer',
            duration: 'required',
            languages: 'required|array|minLength:1', // at least one language
        });

        if (await v.fails()) {
            return failedValidation(res, v);
        }

        // ========= CHECK RECORD EXIST =========
        const test = await Tests.findOne({ where: { TestID: request.testid, IsDeleted: 0 } });
        if (!test) return failed(res, "Invalid Test ID");

        // ========= PDF HANDLER =========
        const uploadDir = "uploadDocs";
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const allowedTypes = ["application/pdf"];

        let testPaperPdf = test.TestPaperPdf;
        let modelAnswerPdf = test.ModelAnswerPdf;

        const testPaperFile = req.files?.testpaperpdf;
        if (testPaperFile) {
            if (!allowedTypes.includes(testPaperFile.mimetype)) return failed(res, "Only PDF allowed for Test Paper");
            if (testPaperPdf && fs.existsSync(testPaperPdf)) fs.unlinkSync(testPaperPdf);
            const fileName = `${Date.now()}-${testPaperFile.name.replace(/\s+/g, "_")}`;
            const filePath = `${uploadDir}/${fileName}`;
            await testPaperFile.mv(filePath);
            testPaperPdf = filePath;
        }

        const modelAnswerFile = req.files?.modelanswerpdf;
        if (modelAnswerFile) {
            if (!allowedTypes.includes(modelAnswerFile.mimetype)) return failed(res, "Only PDF allowed for Model Answer");
            if (modelAnswerPdf && fs.existsSync(modelAnswerPdf)) fs.unlinkSync(modelAnswerPdf);
            const fileName = `${Date.now()}-${modelAnswerFile.name.replace(/\s+/g, "_")}`;
            const filePath = `${uploadDir}/${fileName}`;
            await modelAnswerFile.mv(filePath);
            modelAnswerPdf = filePath;
        }

        // ========= LOCKED LANGUAGES CHECK =========
        const usedLangRows = await McqTestQuestion.findAll({
            where: { TestID: request.testid, isdeleted: false },
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('language')), 'language']],
            raw: true
        });

        const usedLangNames = usedLangRows.map(r => (r.language || '').trim()).filter(Boolean);

        let lockedLangIds = [];
        if (usedLangNames.length > 0) {
            const langRecords = await Languages.findAll({
                where: { name: usedLangNames },
                attributes: ['id'],
                raw: true
            });
            lockedLangIds = langRecords.map(l => Number(l.id));
        }

        // if any locked language is missing → STOP update
        const missingLocked = lockedLangIds.filter(id => !request.languages.includes(id));
        if (missingLocked.length > 0) {
            return failed(res, "You cannot remove languages in which questions exist.");
        }

        // ========= UPDATE TEST =========
        await Tests.update(
            {
                TestTitle: request.testtitle,
                TestTypeID: request.testtypeid,
                ExamTypeID: request.examtypeid,
                TotalMarks: request.totalmarks,
                TotalQuestions: request.totalquestions,
                TestPaperPdf: testPaperPdf,
                ModelAnswerPdf: modelAnswerPdf,
                Syllabus: request.syllabus,
                TargetYear: request.targetyear || null,
                TeacherName: request.teachername,
                Duration: request.duration,
                PositiveMarks: request.positivemarks,
                NegativeMarks: request.negativemarks,
                Description: request.description,
            },
            { where: { TestID: request.testid } }
        );

        // ========= UPDATE LANGUAGES =========
        await TestLanguages.destroy({ where: { TestID: request.testid } });
        const langRecords = request.languages.map(langId => ({
            TestID: request.testid,
            LanguageID: langId,
            AddedOn: new Date()
        }));
        await TestLanguages.bulkCreate(langRecords);

        // ========= RETURN UPDATED TEST =========
        const updated = await Tests.findOne({ where: { TestID: request.testid } });
        return success(res, "Test updated successfully", updated);

    } catch (error) {
        console.error("editTest error:", error);
        return failed(res, error.message);
    }
};

exports.deleteTest = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            testid: 'required|integer'
        });
        if (await v.fails()) return failedValidation(res, v);

        const test = await Tests.findOne({
            where: { TestID: request.testid, IsDeleted: 0 }
        });

        if (!test) return failed(res, "Test not found");

        await Tests.update(
            { IsDeleted: 1 },
            { where: { TestID: request.testid } }
        );

        return success(res, "Test deleted successfully.");
    } catch (error) {
        console.error("deleteTest error:", error);
        return failed(res, error.message);
    }
};

exports.statusTest = async (req, res) => {
    try {
        const request = await decrypter(req.body);

        const v = new Validator(request, {
            testid: 'required|integer'
        });
        if (await v.fails()) return failedValidation(res, v);

        const test = await Tests.findOne({
            where: { TestID: request.testid, IsDeleted: 0 }
        });

        if (!test) return failed(res, "Test not found");

        const newStatus = test.Status === 1 ? 0 : 1;

        await Tests.update(
            { Status: newStatus },
            { where: { TestID: request.testid } }
        );

        return success(res, "Test status updated successfully.");
    } catch (error) {
        console.error("statusTest error:", error);
        return failed(res, error.message);
    }
};
exports.listTests = async (req, res) => {
    try {
        let request = {};
        try {
            request = await decrypter(req.query);
            if (!request || Object.keys(request).length === 0) {
                request = req.query;
            }
        } catch {
            request = req.query;
        }

        // Pagination Setup
        const pageSize = request.limit ? parseInt(request.limit) : 10;
        let page = request.page ? parseInt(request.page) : 1;
        let offset = pageSize * (page - 1);
        const search = request.search ? request.search.trim() : "";

        const BASE_URL = process.env.IMAGE_BASE_URL;

        // Default where condition
        let whereCondition = { IsDeleted: 0 };

        // Filters
        if (request.testTypeId) whereCondition.TestTypeID = request.testTypeId;
        if (request.examTypeId) whereCondition.ExamTypeID = request.examTypeId;

        // Search condition
        let searchCondition = {};

        if (search) {
            page = 1;
            offset = 0;

            searchCondition = {
                [Op.or]: [
                    { TestTitle: { [Op.like]: `%${search}%` } },
                    // If TargetYear is numeric, cast it to CHAR
                    where(
                        literal(`CAST(TargetYear AS CHAR)`),
                        { [Op.like]: `%${search}%` }
                    ),
                ]
            };
        }
        // Fetch Data
        const tests = await Tests.findAndCountAll({
            where: { ...whereCondition, ...searchCondition },
            order: [['TestID', 'DESC']],
            limit: pageSize,
            offset: offset,
            distinct: true, 
            include: [
                {
                    model: TestType,
                    as: 'TestType',
                    attributes: ['ID', 'TestType'],
                    required: false
                },
                {
                    model: ExamType,
                    as: 'ExamType',
                    attributes: ['ID', 'Name'],
                    required: false
                },
                {
                    model: TestLanguages,
                    as: 'TestLanguages',
                    attributes: ['LanguageID'],
                    required: false,
                    include: [
                        {
                            model: Languages,
                            as: 'Language',
                            attributes: ['id', 'name'],
                            required: false
                        }
                    ]
                }
            ]
        });

        // Attach BASE_URL to PDFs
        const updatedRows = tests.rows.map(t => ({
            ...t.dataValues,
            TestPaperPdf: t.TestPaperPdf ? BASE_URL + t.TestPaperPdf : null,
            ModelAnswerPdf: t.ModelAnswerPdf ? BASE_URL + t.ModelAnswerPdf : null
        }));

        return success(res, "Tests fetched successfully", {
            tests: updatedRows,
            total: tests.count,
            page,
            limit: pageSize
        });

    } catch (error) {
        console.error("Error in listTests:", error);
        return failed(res, error.message);
    }
};