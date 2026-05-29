let McqTestQuestion = require("../../../../models").tbl_mcqtestquestions;
let Language = require("../../../../models").tbl_languages;
const { Op, Sequelize, literal, where } = require("sequelize");

const jwt = require("../../../../utils/jwt.util");
let { dump } = require("../../../helper/logs");
let { success, failed, failedValidation } = require("../../../helper/response");
const jwtConfig = require("../../../../config/jwt.config");
const { Validator } = require("node-input-validator");
const {
  decrypter,
  passwordEncrypter,
  dotNetPasswordEncrypt,
  dotNetPasswordDecrypt,
  encrypter,
} = require("../../../helper/crypto");
const { mail } = require("../../../helper/mail");
const admin = require("../../../helper/adminAuth");
const { fn, col } = require("../../../../models").sequelize;
const axios = require("axios");
const fs = require("fs");
const { image } = require("pdfkit");
const xlsx = require("xlsx");
const { last } = require("pdf-lib");

exports.addMcqQuestions = async (req, res) => {
  try {
    let request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    if (!request.TestID) return failed(res, "TestID is required");

    // Parse questions JSON from frontend
    if (request.questions) {
      request.questions = JSON.parse(request.questions);
    }

    if (!request.questions || request.questions.length <= 0)
      return failed(res, "Questions array is required");

    const v = new Validator(request, {
      "questions.*.Question": "required",
      "questions.*.Option1": "required",
      "questions.*.Option2": "required",
      "questions.*.Option3": "required",
      "questions.*.Option4": "required",
      "questions.*.CorrectOption": "required",
      "questions.*.language": "required",
      "questions.*.AnswerDesc": "nullable",
    });

    if (await v.fails()) return failedValidation(res, v);

    const getMaxId = (await McqTestQuestion.max("QuestionID")) || 0;
    let parentQuestionId = "";

    for (let i = 0; i < request.questions.length; i++) {
      let data = request.questions[i];

      data.QuestionID = getMaxId + i + 1;
      data.parentQuestionId = i === 0 ? data.QuestionID : parentQuestionId;
      data.TestID = request.TestID;

      const created = await McqTestQuestion.create(data);

      if (i === 0) parentQuestionId = created.QuestionID;
    }

    return success(res, "Questions added successfully");
  } catch (error) {
    console.error("addMcqQuestions error:", error);
    return failed(res, error.message);
  }
};

exports.updateMcqQuestions = async (req, res) => {
  try {
    let request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");
    if (!request.TestID) return failed(res, "TestID is required");

    if (typeof request.questions === "string") {
      request.questions = JSON.parse(request.questions);
    }

    if (!request.questions || request.questions.length <= 0)
      return failed(res, "Questions array is required");

    const v = new Validator(request, {
      "questions.*.QuestionID": "integer", // optional for new questions
      "questions.*.Question": "required|string",
      "questions.*.Option1": "required|string",
      "questions.*.Option2": "required|string",
      "questions.*.Option3": "required|string",
      "questions.*.Option4": "required|string",
      "questions.*.CorrectOption": "required",
      "questions.*.language": "required|string",
      "questions.*.AnswerDesc": "nullable|string",
    });

    if (await v.fails()) return failedValidation(res, v);

    const mainQuestion = request.questions[0]; // assume first language is main
    let parentQuestionId = mainQuestion.QuestionID; // existing QuestionID

    await Promise.all(
      request.questions.map(async (q, index) => {
        x;
        if (q.QuestionID) {
          // Update existing question
          await McqTestQuestion.update(
            {
              Question: q.Question,
              Option1: q.Option1,
              Option2: q.Option2,
              Option3: q.Option3,
              Option4: q.Option4,
              CorrectOption: q.CorrectOption,
              language: q?.language?.toLowerCase() || "",
              AnswerDesc: q.AnswerDesc,
            },
            { where: { QuestionID: q.QuestionID, TestID: request.TestID } },
          );
        } else {
          // Create new question (missing language)
          await McqTestQuestion.create({
            Question: q.Question,
            Option1: q.Option1,
            Option2: q.Option2,
            Option3: q.Option3,
            Option4: q.Option4,
            CorrectOption: q.CorrectOption,
            language: q?.language?.toLowerCase() || "",
            AnswerDesc: q.AnswerDesc,
            parentQuestionId: parentQuestionId,
            TestID: request.TestID,
          });
        }
      }),
    );

    return success(res, "Questions updated successfully");
  } catch (error) {
    console.error("updateMcqQuestions error:", error);
    return failed(res, error.message);
  }
};

exports.listMcqQuestions = async (req, res) => {
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

    // Make TestID mandatory
    if (!request.TestID) {
      return failed(res, "TestID is required");
    }

    let pageSize = request.limit ? parseInt(request.limit) : 10;
    let page = request.page ? parseInt(request.page) : 1;
    let offset = pageSize * (page - 1);
    let search = request.search ? request.search : "";
    let testID = request.TestID; // now guaranteed to exist
    let language = request.language ? request.language : "";

    whereCondition = {
      isdeleted: false,
      TestID: testID,
      // [Op.and]: Sequelize.literal("QuestionID = parentQuestionId"),
    };

    if (search) {
      page = 1;
      offset = 0;

      whereCondition = {
        isdeleted: false,
        TestID: testID,
        // [Op.and]: Sequelize.literal("QuestionID = parentQuestionId"),
        [Op.or]: [{ Question: { [Op.substring]: search } }],
      };
    }

    
    let displayIndex = 0;
    let lastParentId = null;
    const allQuestions = await McqTestQuestion.findAll({
      where: whereCondition,
      order: [
        ["parentQuestionId", "ASC"], // first grouping by parent
        ["language", "ASC"], // then language inside parent
      ],
    });
    const indexOfQuestions = allQuestions.map((q) => {
      if (q.parentQuestionId !== lastParentId) {
        displayIndex++;
        lastParentId = q.parentQuestionId;
      }
      
      return {
        questionId: q.QuestionID,
        parentQuestionId: q.parentQuestionId,
        displayIndex, // 👈 THIS is your index
      };
    });
    
    if (language) {
      whereCondition = {
        ...whereCondition,
        language: language,
      };
    }

    const questions = await McqTestQuestion.findAndCountAll({
      where: whereCondition,
      order: [
        ["parentQuestionId", "ASC"], // first grouping by parent
        ["language", "ASC"], // then language inside parent
      ],
      limit: pageSize,
      offset: offset,
    });

    const formatQuestions = questions.rows.map((q) => {
      const displayIndex = indexOfQuestions
        .filter((d) => d.questionId === q.QuestionID)
        .map((d) => d.displayIndex)[0];

      return {
        ...q.dataValues,
        QuestionNo: displayIndex,
      };
    });

    return success(res, "MCQ questions fetched successfully", {
      questions: formatQuestions,
      total: questions.count,
      page: page,
      limit: pageSize,
    });
  } catch (error) {
    console.error("Error in listMcqQuestions:", error);
    return failed(res, error.message);
  }
};

exports.getQuestionAllLanguages = async (req, res) => {
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

    if (!request.QuestionID) {
      return failed(res, "QuestionID is required");
    }

    const questionId = request.QuestionID;

    const isQuestion = await McqTestQuestion.findOne({
      where: {
        QuestionID: questionId,
      },
    });

    if (!isQuestion) return failed(res, "Question not found");

    // fetch parent + translations (all records with same parentQuestionId)
    const allQuestions = await McqTestQuestion.findAll({
      where: {
        parentQuestionId: isQuestion.parentQuestionId,
        isdeleted: false,
      },
      order: [["language", "ASC"]], // optional: sort by language
    });

    if (!allQuestions || allQuestions.length === 0) {
      return failed(res, "No question found");
    }

    // return all in one array
    return success(res, "All language questions fetched", {
      questions: allQuestions,
    });
  } catch (error) {
    console.error("Error:", error);
    return failed(res, error.message);
  }
};
exports.deleteMcqQuestion = async (req, res) => {
  try {
    const request = await decrypter(req.body);

    const v = new Validator(request, {
      questionid: "required|integer",
    });
    if (await v.fails()) return failedValidation(res, v);

    const question = await McqTestQuestion.findOne({
      where: { QuestionID: request.questionid, isdeleted: false },
    });

    if (!question) return failed(res, "Question not found");

    // --- check if this is a parent question
    let parentIdToDelete =
      question.parentQuestionId == question.QuestionID
        ? question.QuestionID
        : question.parentQuestionId;

    // Delete the clicked question
    await McqTestQuestion.update(
      { isdeleted: true },
      { where: { QuestionID: request.questionid } },
    );

    // Delete all related language entries
    await McqTestQuestion.update(
      { isdeleted: true },
      { where: { parentQuestionId: parentIdToDelete } },
    );

    return success(
      res,
      "Question and its related translations deleted successfully.",
    );
  } catch (error) {
    console.error("deleteMcqQuestion error:", error);
    return failed(res, error.message);
  }
};

exports.dropdownLanguages = async function (req, res) {
  try {
    // Accept decrypted or normal query
    let requests = await decrypter(req.query);
    if (!requests || Object.keys(requests).length === 0) {
      requests = req.query;
    }

    // Fetch all languages ordered by name
    const languages = await Language.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });

    if (languages.length === 0) {
      return failed(res, "No languages found");
    }

    return success(res, "Languages dropdown fetched", { languages });
  } catch (error) {
    return failed(res, error.message);
  }
};

exports.ImportMcqQuestions = async function (req, res) {
  try {
    const request = await decrypter(req.body);
    if (!request) return failed(res, "Invalid request");

    const v = new Validator(request, {
      testId: "required",
    });

    if (await v.fails()) return failedValidation(res, v);
    /* ================= FILE VALIDATION ================= */

    const questionsFile = req.files?.questions;
    if (!questionsFile) {
      return failed(res, "Questions Excel file is required");
    }

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!allowedTypes.includes(questionsFile.mimetype)) {
      return failed(res, "Only Excel files are allowed");
    }

    const uploadDir = "uploadDocs";
    const fileName = `${Date.now()}-${questionsFile.name.replace(/\s+/g, "_")}`;
    const filePath = `${uploadDir}/${fileName}`;
    await questionsFile.mv(filePath);

    /* ================= READ EXCEL ================= */

    const workbook = xlsx.readFile(filePath);
    if (!workbook.SheetNames.length) {
      return failed(res, "Excel file is empty");
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!data.length) {
      return failed(res, "No data found in Excel");
    }

    /* ================= CONFIG ================= */

    const LANGUAGE_MAP = {
      english: "english",
      en: "english",
      eng: "english",
      hindi: "hindi",
      hi: "hindi",
      marathi: "marathi",
      mr: "marathi",
    };

    const REQUIRED_FIELDS = [
      "QuestionNo",
      "Question",
      "Language",
      "Option1",
      "Option2",
      "Option3",
      "Option4",
      "CorrectOption",
    ];

    /* ================= PHASE 1: VALIDATION ================= */

    let validationErrors = [];
    let validatedData = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (header +1)

      // Required fields
      for (const field of REQUIRED_FIELDS) {
        if (!row[field]) {
          validationErrors.push({
            row: rowNumber,
            field,
            message: `${field} is required`,
          });
        }
      }

      // Language validation
      const languageNormalized =
        LANGUAGE_MAP[row.Language?.toString().trim().toLowerCase()];

      if (!languageNormalized) {
        validationErrors.push({
          row: rowNumber,
          field: "Language",
          message: `Invalid language: ${row.Language}`,
        });
      }

      // CorrectOption validation
      if (
        ![
          "1",
          "2",
          "3",
          "4",
          "A",
          "B",
          "C",
          "D",
          "OptionA",
          "OptionB",
          "OptionC",
          "OptionD",
          "Option1",
          "Option2",
          "Option3",
          "Option4",
        ].includes(row.CorrectOption)
      ) {
        validationErrors.push({
          row: rowNumber,
          field: "CorrectOption",
          message: "CorrectOption must be between 1 and 4",
        });
      }

      // If row is valid, store normalized data
      if (
        row.Question &&
        row.Language &&
        languageNormalized &&
        [
          "1",
          "2",
          "3",
          "4",
          "A",
          "B",
          "C",
          "D",
          "OptionA",
          "OptionB",
          "OptionC",
          "OptionD",
          "Option1",
          "Option2",
          "Option3",
          "Option4",
        ].includes(row.CorrectOption)
      ) {
        validatedData.push({
          ...row,
          language: languageNormalized,
        });
      }
    });

    // ❌ Stop if any validation error exists
    if (validationErrors.length > 0) {
      return res.json(
        encrypter(
          (response = {
            code: 100,
            message: "Failed to import questions",
            data: {
              totalErrors: validationErrors.length,
              errors: validationErrors,
            },
          }),
        ),
      );
    }

    /* ================= PHASE 2: INSERT ================= */

    const questionNoArr = [...new Set(validatedData.map((d) => d.QuestionNo))];

    for (const q of questionNoArr) {
      let lastId = (await McqTestQuestion.max("QuestionID")) || 0;
      let parentQuestionId = lastId + 1;

      const questionArrNoAndLanguageWise = validatedData.filter(
        (d) => d.QuestionNo == q,
      );

      for (const row of questionArrNoAndLanguageWise) {
        const co = getCorrectOption(row);
        const existingQuestion = await McqTestQuestion.findOne({
          where: {
            TestID: request.testId,
            Question: row.Question,
            language: row?.language?.toLowerCase() || "",
            isdeleted: false,
          },
        });

        if (existingQuestion) {
          // already exists → skip insert
          parentQuestionId = existingQuestion.QuestionID;
          continue;
        }
        const q = await McqTestQuestion.create({
          TestID: request.testId,
          Question: row.Question,
          Option1: row.Option1,
          Option2: row.Option2,
          Option3: row.Option3 || null,
          Option4: row.Option4 || null,
          CorrectOption: co,
          AnswerDesc: row.Explaination || null,
          isdeleted: false,
          isimport: true,
          parentQuestionId,
          language: row?.language?.toLowerCase() || "",
        });
        parentQuestionId = q.QuestionID;
      }
    }

    return success(res, "Questions imported successfully");
  } catch (error) {
    console.error(error);
    return failed(res, error.message);
  }
};

const getCorrectOption = (row) => {
  if (
    row.CorrectOption == "1" ||
    row.CorrectOption == "A" ||
    row.CorrectOption == "Option1" ||
    row.CorrectOption == "OptionA"
  ) {
    return "Option1";
  }
  if (
    row.CorrectOption == "2" ||
    row.CorrectOption == "B" ||
    row.CorrectOption == "Option2" ||
    row.CorrectOption == "OptionB"
  ) {
    return "Option2";
  }
  if (
    row.CorrectOption == "3" ||
    row.CorrectOption == "C" ||
    row.CorrectOption == "Option3" ||
    row.CorrectOption == "OptionC"
  ) {
    return "Option3";
  }
  if (
    row.CorrectOption == "4" ||
    row.CorrectOption == "D" ||
    row.CorrectOption == "Option4" ||
    row.CorrectOption == "OptionD"
  ) {
    return "Option4";
  }

  return "";
};

exports.deleteMultipleMcqQuestion = async (req, res) => {
  try {
    const request = await decrypter(req.body);

    const v = new Validator(request, {
      questionIds: "required",
    });
    if (await v.fails()) return failedValidation(res, v);

    const question = await McqTestQuestion.findAll({
      where: {
        QuestionID: { [Op.in]: request.questionIds },
        isdeleted: false,
      },
    });

    if (!question || question.length === 0) {
      return failed(res, "Question not found");
    }

    await McqTestQuestion.update(
      { isdeleted: true },
      {
        where: {
          isdeleted: false,
          [Op.or]: [
            { QuestionID: { [Op.in]: request.questionIds } },
            { parentQuestionId: { [Op.in]: request.questionIds } },
          ],
        },
      },
    );

    return success(
      res,
      "Questions and its related translations deleted successfully.",
    );
  } catch (error) {
    console.error("deleteMultipleMcqQuestion error:", error);
    return failed(res, error.message);
  }
};
