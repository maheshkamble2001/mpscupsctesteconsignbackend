let TestType = require("../../../../models").tbl_testtypes;
let Examtype = require("../../../../models").tbl_examtype;
let Tests = require("../../../../models").tbl_tests;
let Exam = require("../../../../models").tbl_exam;
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


    let pageSize = request.limit ? parseInt(request.limit) : 10;
    let page = request.page ? parseInt(request.page) : 1;
    let offset = pageSize * (page - 1);
    let search = request.search || "";

    if (search) {
      params[Op.or] = [{ ExamName: { [Op.substring]: search } }];
    }
    // Fetch all active test types without pagination or search
    const exam = await Exam.findAndCountAll({
      where: {
        ...params,
      },
      order: [["AddedOn", "DESC"]],
      limit: pageSize,
      offset: offset,
    });

    
    if (!exam.length) return failed(res, "Exam not found");

    return success(res, "Exam fetched successfully", { exam });
  } catch (error) {
    return failed(res, error.message);
  }
};