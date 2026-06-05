const Subject = require("../../../../models").tbl_subjects;
const { Op } = require("sequelize");
const { Validator } = require("node-input-validator");
const { decrypter } = require("../../../helper/crypto");
const {
  success,
  failed,
  failedValidation,
} = require("../../../helper/response");

/**
 * Create a new subject
 */
exports.createSubject = async (req, res) => {
  try {
    const request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    const v = new Validator(request, {
      subjectName: "required|string",
    });

    if (await v.fails()) return failedValidation(res, v);

    const existing = await Subject.findOne({
      where: {
        SubjectName: request.subjectName,
        IsDeleted: 0,
      },
    });

    if (existing) {
      return failed(res, "Subject already exists");
    }

    await Subject.create({
      SubjectName: request.subjectName,
      Description: request.description,
      Status: request.status !== undefined ? request.status : 1,
      IsDeleted: 0,
      AddedOn: new Date(),
    });

    return success(res, "Subject created successfully");
  } catch (error) {
    console.error("createSubject error:", error);
    return failed(res, error.message);
  }
};

/**
 * Update an existing subject
 */
exports.updateSubject = async (req, res) => {
  try {
    const request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    const v = new Validator(request, {
      subjectId: "required",
      subjectName: "required|string",
    });

    if (await v.fails()) return failedValidation(res, v);

    const subject = await Subject.findOne({
      where: { SubjectID: request.subjectId, IsDeleted: 0 },
    });

    if (!subject) return failed(res, "Subject not found");

    const duplicate = await Subject.findOne({
      where: {
        SubjectID: { [Op.ne]: request.subjectId },
        SubjectName: request.subjectName,
        IsDeleted: 0,
      },
    });

    if (duplicate) {
      return failed(res, "Subject already exists");
    }

    await Subject.update(
      {
        SubjectName: request.subjectName,
        Description: request.description,
        Status: request.status !== undefined ? request.status : subject.Status,
      },
      { where: { SubjectID: request.subjectId } },
    );

    return success(res, "Subject updated successfully");
  } catch (error) {
    console.error("updateSubject error:", error);
    return failed(res, error.message);
  }
};

/**
 * Soft delete a subject
 */
exports.deleteSubject = async (req, res) => {
  try {
    const request = await decrypter(req.body);
    if (!request || !request.subjectId)
      return failed(res, "SubjectID is required");

    const subject = await Subject.findOne({
      where: { SubjectID: request.subjectId, IsDeleted: 0 },
    });

    if (!subject) return failed(res, "Subject not found");

    await Subject.update(
      { IsDeleted: 1 },
      { where: { SubjectID: request.subjectId } },
    );

    return success(res, "Subject deleted successfully");
  } catch (error) {
    console.error("deleteSubject error:", error);
    return failed(res, error.message);
  }
};

/**
 * List subjects with optional search and pagination
 */
exports.listSubjects = async (req, res) => {
  try {
    let request = {};
    try {
      request = (await decrypter(req.query)) || req.query;
    } catch {
      request = req.query;
    }

    const pageSize = request.limit ? parseInt(request.limit, 10) : 10;
    const page = request.page ? parseInt(request.page, 10) : 1;
    const offset = pageSize * (page - 1);
    const search = request.search || "";

    const whereCondition = { IsDeleted: 0 };
    if (search) {
      whereCondition.SubjectName = { [Op.substring]: search };
    }
    if (request.status !== undefined) {
      whereCondition.Status = request.status;
    }

    const subjects = await Subject.findAndCountAll({
      where: whereCondition,
      order: [["AddedOn", "DESC"]],
      limit: pageSize,
      offset,
    });

    return success(res, "Subjects fetched successfully", {
      subjects: subjects.rows,
      total: subjects.count,
      page,
      limit: pageSize,
    });
  } catch (error) {
    console.error("listSubjects error:", error);
    return failed(res, error.message);
  }
};


exports.getSubjectDropdown = async function (req, res) {
  try {
    const subjects = await Subject.findAll({
      where: {
        // IsDeleted: 0,
        Status: 1,
      },
      attributes: ["SubjectID", "SubjectName"],
      order: [["SubjectName", "ASC"]],
    });

    const dropdown = subjects.map((item) => ({
      value: item.SubjectID,
      label: item.SubjectName,
    }));

    return success(res, "Subject dropdown fetched successfully", dropdown);
  } catch (error) {
    return failed(res, error.message);
  }
};