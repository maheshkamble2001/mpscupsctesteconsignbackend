let TestType = require("../../../../models").tbl_testtypes;
let Examtype = require("../../../../models").tbl_examtype;
let Tests = require("../../../../models").tbl_tests;
let Testlanguages = require("../../../../models").tbl_testlanguages;
let Mcqtestuserresults = require("../../../../models").tbl_mcqtestuserresults;
let Mcqtestquestions = require("../../../../models").tbl_mcqtestquestions;
const StudentCourses = require("../../../../models").tbl_webusercourses;
const TestCourses = require("../../../../models").tbl_coursetests;
const languages = require("../../../../models").tbl_languages;
const testLanguages = require("../../../../models").tbl_testlanguages;
const Courses = require("../../../../models").tbl_courses;
const jwtverify = require("jsonwebtoken");
const xlsx = require("xlsx");

const { Op, Sequelize, literal } = require("sequelize");

const jwt = require("../../../../utils/jwt.util");
const jwt2 = require("jsonwebtoken");
let { dump } = require("../../../helper/logs");
let { success, failed, failedValidation } = require("../../../helper/response");
const jwtConfig = require("../../../../config/jwt.config");
const { Validator } = require("node-input-validator");
const {
  decrypter,
  passwordEncrypter,
  dotNetPasswordEncrypt,
  dotNetPasswordDecrypt,
} = require("../../../helper/crypto");
const { mail } = require("../../../helper/mail");
const admin = require("../../../helper/adminAuth");
const { fn, col } = require("../../../../models").sequelize;
const axios = require("axios");

exports.GetTestList = async function (req, res) {
  try {
    // Use decrypted or normal request
    let params = {};
    let requests = await decrypter(req.query);
    if (!requests || Object.keys(requests).length === 0) requests = req.query;

    const tests = await Tests.findAll({
      where: {
        ...params,
        IsDeleted: 0,
      },
      order: [["TestType", "ASC"]],
    });

    let retaketestflag = false;
    var decoded = jwtverify.verify(
      requests.access_token,
      process.env.JWT_SECRET,
    );
    let studentId = decoded?.studentid;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      let findinresult = await Mcqtestuserresults.findOne({
        where: {
          studentid: studentId,
          testid: test.TestID,
        },
      });

      if (findinresult) {
        retaketestflag = true;
      }
      test.setDataValue("retakeflag", !!findinresult);
    }

    if (!tests.length) return failed(res, "Test not found");

    return success(res, "Test fetched successfully", { tests });
  } catch (error) {
    return failed(res, error.message);
  }
};

exports.GetTestList2 = async function (req, res) {
  try {
    // Use decrypted or normal request
    let params = {};
    let requests = await decrypter(req.query);
    if (!requests || Object.keys(requests).length === 0) requests = req.query;

    // Fetch all active test types without pagination or search

    if (requests.testtypeid) {
      params = Object.assign(params, {
        TestTypeID: requests.testtypeid,
      });
    }
    if (requests.examtypeid) {
      params = Object.assign(params, {
        ExamTypeID: requests.examtypeid,
      });
    }
    const tests = await Tests.findAll({
      where: {
        ...params,
        IsDeleted: 0,
      },
      attributes: [
        "TestID",
        "TestTitle",
        "TestTypeID",
        [
          literal(
            "(SELECT testtype FROM tbl_testtypes WHERE tbl_testtypes.id = tbl_tests.TestTypeID LIMIT 1)",
          ),
          "TestType",
        ],
        "ExamTypeID",
        [
          literal(
            "(SELECT name FROM tbl_examtype WHERE tbl_examtype.id = tbl_tests.ExamTypeID LIMIT 1)",
          ),
          "ExamType",
        ],
        "TotalMarks",
        "TotalQuestions",
        "TestPaperPdf",
        "ModelAnswerPdf",
        "Syllabus",
        "TargetYear",
        "TeacherName",
        "Duration",
        "PositiveMarks",
        "NegativeMarks",
        "Description",
      ],
      order: [["TestType", "ASC"]],
    });

    let retaketestflag = false;
    var decoded = jwtverify.verify(
      requests.access_token,
      process.env.JWT_SECRET,
    );
    let studentId = decoded?.studentid;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      let findinresult = await Mcqtestuserresults.findOne({
        where: {
          studentid: studentId,
          testid: test.TestID,
        },
      });

      if (findinresult) {
        retaketestflag = true;
      }
      test.setDataValue("retakeflag", !!findinresult);
    }

    if (!tests.length) return failed(res, "Test not found");

    return success(res, "Test fetched successfully", { tests });
  } catch (error) {
    return failed(res, error.message);
  }
};
exports.GetTestbyId = async function (req, res) {
  try {
    // Use decrypted or normal request
    let data = {};
    let params = {};
    let requests = await decrypter(req.query);

    if (!requests) return failed(res, "Internal server error");

    const v = new Validator(requests, {
      testid: "required",
    });
    if (await v.fails()) return failedValidation(res, v);

    params = {
      TestID: requests.testid,
    };
    const test = await Tests.findOne({
      where: {
        ...params,
        IsDeleted: 0,
      },
      attributes: [
        "TestID",
        "TestTitle",
        "TestTypeID",
        [
          literal(
            "(SELECT testtype FROM tbl_testtypes WHERE tbl_testtypes.id = tbl_tests.TestTypeID LIMIT 1)",
          ),
          "TestType",
        ],
        "ExamTypeID",
        [
          literal(
            "(SELECT name FROM tbl_examtype WHERE tbl_examtype.id = tbl_tests.ExamTypeID LIMIT 1)",
          ),
          "ExamType",
        ],
        "TotalMarks",
        "TotalQuestions",
        "TestPaperPdf",
        "ModelAnswerPdf",
        "Syllabus",
        "TargetYear",
        "TeacherName",
        "Duration",
        "PositiveMarks",
        "NegativeMarks",
        "Description",
      ],
      order: [["TestType", "ASC"]],
    });

    if (!test) {
      return failed(res, "Test not found");
    }

    let testlanguages = await Testlanguages.findAll({
      where: {
        testid: requests.testid,
      },
      attributes: [
        "testid",
        [
          literal(`(
                SELECT name 
                FROM tbl_languages 
                WHERE tbl_languages.id = tbl_testlanguages.languageid 
                LIMIT 1
            )`),
          "language",
        ],
      ],
      group: ["testid", "languageid"], // Add this
    });

    data = {
      testlanguages: testlanguages,
      test: test,
    };

    return success(res, "Test fetched successfully", data);
  } catch (error) {
    return failed(res, error.message);
  }
};
exports.uploadTestQuestionsByExcel = async (req, res) => {
  try {
    var requests = await decrypter(req.body);
    if (!requests) return failed(res, "Internal server error");

    const v = new Validator(requests, {
      testid: "required",
      language: "required",
    });
    if (await v.fails()) return failedValidation(res, v);

    const v2 = new Validator(req.files, {
      excelFile: "required|mime:xlsx",
    });
    if (!(await v2.check())) return failedValidation(res, v2);

    let readDataFile = xlsx.read(req.files.excelFile.data, { type: "buffer" });
    const wsname = readDataFile.SheetNames[0];
    const ws = readDataFile.Sheets[wsname];
    const rows = xlsx.utils.sheet_to_json(ws);

    // Expected columns
    const expectedHeaders = [
      "Question",
      "Option1",
      "Option2",
      "Option3",
      "Option4",
      "CorrectOption",
      "Description",
    ];

    const excelHeaders = Object.keys(rows[0]);
    const missingHeaders = expectedHeaders.filter(
      (h) => !excelHeaders.includes(h),
    );
    if (missingHeaders.length > 0) {
      return failed(res, `Missing headers: ${missingHeaders.join(", ")}`);
    }

    // Prevent duplicate upload for same language
    const alreadyUploaded = await Mcqtestquestions.findOne({
      where: {
        TestID: requests.testid,
        language: requests.language,
        isimport: 1,
        isdeleted: 0,
      },
    });

    if (alreadyUploaded) {
      return failed(res, `Questions already uploaded for ${requests.language}`);
    }

    // ----------------------------------------
    // ⭐ FIND BASE LANGUAGE (FIRST UPLOADED)
    // ----------------------------------------

    let baseQuestions = await Mcqtestquestions.findAll({
      where: {
        TestID: requests.testid,
        isimport: 1,
        isdeleted: 0,
      },
      order: [["QuestionID", "ASC"]],
    });

    let baseLanguage = null;

    if (baseQuestions.length === 0) {
      // This is the FIRST language upload → becomes base language
      baseLanguage = requests.language;
    } else {
      // Identify existing base language
      baseLanguage = baseQuestions[0].language;

      // Fetch only base language questions ordered correctly
      baseQuestions = baseQuestions.filter((q) => q.language === baseLanguage);
    }

    // ----------------------------------------
    // ⭐ PROCESS UPLOAD
    // ----------------------------------------

    for (let i = 0; i < rows.length; i++) {
      let parentId = null;

      if (requests.language === baseLanguage) {
        // Base language → parent = itself (after creation)
        parentId = null;
      } else {
        // Other language → map to base language question by index
        parentId = baseQuestions[i]?.QuestionID;

        if (!parentId) {
          return failed(
            res,
            `Mismatch: Base language(${baseLanguage}) does not have question at row ${i + 1}`,
          );
        }
      }

      // Create question
      let created = await Mcqtestquestions.create({
        TestID: requests.testid,
        Question: rows[i].Question,
        Option1: rows[i].Option1,
        Option2: rows[i].Option2,
        Option3: rows[i].Option3,
        Option4: rows[i].Option4,
        CorrectOption: rows[i].CorrectOption,
        AnswerDesc: rows[i].Description,
        language: requests.language,
        isimport: 1,
        parentQuestionId: parentId,
      });

      // If base language → update its own parent ID
      if (requests.language === baseLanguage) {
        await created.update({
          parentQuestionId: created.QuestionID,
        });
      }
    }

    return success(res, `${requests.language} questions uploaded successfully`);
  } catch (error) {
    dump("Error", error);
    return failed(res, error.message);
  }
};

/**
 * @description List student tests with pagination and search
 */
exports.listStudentTests = async (req, res) => {
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

    let whereCondition = {};

    if (request.testType) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { testTypeId: request.testType },
        ],
      };
    }
    // verify student
    const decoded = jwt2.verify(request.access_token, process.env.JWT_SECRET);
    const studentId = decoded.studentid;

    if (!studentId) return failed(res, "Student not found!");

    // Get active courses
    const courses = await StudentCourses.findAll({
      where: {
        studentid: studentId,
        status: true,
      },
      attributes: ["courseid"],
      raw: true,
    });

    let courseIds = courses.map((c) => c.courseid);

    if (!courseIds.length) {
      return failed(res, "No active courses found");
    }

    const course = await Courses.findAll({
      where: {
        CourseID: { [Op.in]: courseIds },
        IsDeleted: 0,
        status: true,
      },
    });
    courseIds = course.map((c) => c.CourseID);

    if (!courseIds.length) {
      return failed(res, "No active courses found");
    }

    const today = new Date();

    // Get valid tests for today
    const courseTests = await TestCourses.findAll({
      where: {
        CourseID: { [Op.in]: courseIds },
        scheduleDate: { [Op.lte]: today }, // started
        ValidDate: { [Op.gte]: today }, // not expired
      },
      attributes: [
        "TestID",
        "scheduleDate",
        "ValidDate",
        "TestType",
        "language",
      ],
      order: [["scheduleDate", "ASC"]],
      raw: true,
    });

    const testIds = courseTests.map((test) => test.TestID);

    if (!testIds.length) {
      return failed(res, "No active tests found");
    }

    const tests = await Tests.findAll({
      where: {
        ...whereCondition,
        TestID: { [Op.in]: testIds },
        IsDeleted: 0,
      },
      attributes: [
        "TestID",
        "TestTitle",
        "TestTypeID",
        [
          literal(
            "(SELECT testtype FROM tbl_testtypes WHERE tbl_testtypes.id = tbl_tests.TestTypeID LIMIT 1)",
          ),
          "TestType",
        ],
        "ExamTypeID",
        [
          literal(
            "(SELECT name FROM tbl_examtype WHERE tbl_examtype.id = tbl_tests.ExamTypeID LIMIT 1)",
          ),
          "ExamType",
        ],
        "TotalMarks",
        "TotalQuestions",
        "TestPaperPdf",
        "ModelAnswerPdf",
        "Syllabus",
        "TargetYear",
        "TeacherName",
        "Duration",
        "PositiveMarks",
        "NegativeMarks",
        "Description",
      ],
      include: [
        {
          model: Testlanguages,
          as: "TestLanguages",
          attributes: ["TestID", "LanguageID"],
          include: [
            {
              model: languages,
              as: "Language",
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["TestType", "ASC"]],
    });

    const formattedTests = tests.map((test) => ({
      testId: test.TestID,
      title: test.TestTitle,
      testTypeId: test.TestTypeID,
      testType: test.get("TestType"), // because it's literal
      examTypeId: test.ExamTypeID,
      examType: test.get("ExamType"),
      totalMarks: test.TotalMarks || 0,
      totalQuestions: test.TotalQuestions || 0,
      durationMinutes: test.Duration || 0,

      marks: {
        positive:test.PositiveMarks || 0,
        negative: test.NegativeMarks || 0,
      },

      resources: {
        questionPaper: test.TestPaperPdf || null,
        modelAnswer: test.ModelAnswerPdf || null,
        syllabus: test.Syllabus || null,
      },

      targetYear: test.TargetYear,
      teacherName: test.TeacherName,
      description: test.Description,

      // ✅ Extract only language names
      languages: test.TestLanguages
        ? test.TestLanguages.map((tl) => tl.Language?.name).filter(Boolean)
        : [],
    }));

    return success(res, "Student Tests fetched successfully", {
      tests: formattedTests || [],
      count: tests.length,
    });
  } catch (error) {
    console.error("listStudentTests error:", error);
    return failed(res, error.message);
  }
};
