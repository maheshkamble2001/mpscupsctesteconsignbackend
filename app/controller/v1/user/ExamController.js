let TestType = require("../../../../models").tbl_testtypes;
let Examtype = require("../../../../models").tbl_examtype;
let Tests = require("../../../../models").tbl_tests;
let Exam = require("../../../../models").tbl_exam;
let Testlanguages = require("../../../../models").tbl_testlanguages;
let Mcqtestuserresults = require("../../../../models").tbl_mcqtestuserresults;
let Mcqtestquestions = require("../../../../models").tbl_mcqtestquestions;
const StudentCourses = require("../../../../models").tbl_webusercourses;
const TestCourses = require("../../../../models").tbl_coursetests;
const StudentExam = require("../../../../models").tbl_studentexams;
const languages = require("../../../../models").tbl_languages;
const testLanguages = require("../../../../models").tbl_testlanguages;
const Courses = require("../../../../models").tbl_courses;
const jwtverify = require("jsonwebtoken");
const xlsx = require("xlsx");

const { Op, Sequelize, literal, where } = require("sequelize");

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

exports.GetExamsList = async function (req, res) {
  try {
    let params = {};

    let request = await decrypter(req.query);
    if (!request || Object.keys(request).length === 0) {
      request = req.query;
    }

    let pageSize = request.limit ? parseInt(request.limit) : 6;
    let page = request.page ? parseInt(request.page) : 1;
    let offset = pageSize * (page - 1);
    let search = request.search || "";
    let isFull = request.full || false;
    // let studentId = request.studentId || "";
    if (request.access_token) {

      var decoded = null;

      decoded = jwtverify.verify(
        request.access_token,
        process.env.JWT_SECRET,
      );
      let studentId = decoded?.studentid;

      // ✅ Student filter
      if (studentId) {
        const students = await StudentExam.findAll({
          where: { studentid: studentId },
          attributes: ["examid"], // 🔥 optimized
          raw: true
        });

        const examIds = students.map(d => d.examid);

        if (examIds.length === 0) {
          return success(res, "No exams found", {
            exam: [],
            total: 0
          });
        }
        if (!isFull) {

          params.ExamId = {
            [Op.in]: examIds
          };
        }
      }
    }

    // ✅ Search filter
    if (search) {
      params[Op.or] = [
        { ExamName: { [Op.substring]: search } }
      ];
    }

    // ✅ Main query with count
    const { rows: exam, count: total } = await Exam.findAndCountAll({
      where: {
        ...params,
        // IsDeleted: false // uncomment if needed
      },
      order: [["AddedOn", "DESC"]],
      limit: pageSize,
      offset: offset
    });

    return success(res, "Exam fetched successfully", {
      exam,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (error) {
    console.log("Error GetExamList :", error)
    return failed(res, error.message);
  }
};