const Course = require("../../../../models").tbl_courses;
const Student = require("../../../../models").tbl_students;
const StudentCourses = require("../../../../models").tbl_webusercourses;
const TestCourses = require("../../../../models").tbl_coursetests;
const TestLanguages = require("../../../../models").tbl_testlanguages;
const TestType = require("../../../../models").tbl_testtypes;
const Test = require("../../../../models").tbl_tests;
const { Op, where } = require("sequelize");
const { Validator } = require("node-input-validator");
const { decrypter } = require("../../../helper/crypto");
const {
  success,
  failed,
  failedValidation,
} = require("../../../helper/response");
let { v4 } = require("uuid");

/**
 * @description Add a new course
 */
exports.addCourse = async (req, res) => {
  try {
    let request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    const v = new Validator(request, {
      courseTitle: "required|string",
      // CourseCategory: "required|string",
      targetYear: "required",
      courseFees: "required",
    });

    if (await v.fails()) return failedValidation(res, v);

    const isCourse = await Course.findOne({
      where: {
        CourseTitle: request.courseTitle,
        // TargetYear:request.targetYear
      },
    });

    if (isCourse) {
      return failed(res, "Course is already exist");
    }

    // Map incoming data to model structure
    const courseData = {
      CourseID: v4(),
      CourseTitle: request.courseTitle,
      //   CourseCategory: DataTypes.STRING(100),
      TargetYear: request.targetYear,
      Description: request.description,
      StartDate: request.startDate,
      EndDate: request.endDate,
      CourseFees: request.courseFees || 0,
      CourseType: request.courseType,
      Status: 1,
      IsDeleted: 0,
      AddedOn: new Date(),
    };
    await Course.create(courseData);

    return success(res, "Course created successfully", {});
  } catch (error) {
    console.error("addCourse error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Update existing course
 */
exports.updateCourse = async (req, res) => {
  try {
    let request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    const v = new Validator(request, {
      courseId: "required",
      courseTitle: "required|string",
      // CourseCategory: "required|string",
      targetYear: "required",
      courseFees: "required",
    });

    if (await v.fails()) return failedValidation(res, v);

    const course = await Course.findOne({
      where: { CourseID: request.courseId, IsDeleted: 0 },
    });

    if (!course) return failed(res, "Course not found");

    const isCourse = await Course.findOne({
      where: {
        CourseID: { [Op.ne]: request.courseId },
        CourseTitle: request.courseTitle,
        // TargetYear:request.targetYear
      },
    });

    if (isCourse) {
      return failed(res, "Course is already exist");
    }

    const courseData = {
      CourseTitle: request.courseTitle,
      //   CourseCategory: DataTypes.STRING(100),
      TargetYear: request.targetYear,
      Description: request.description,
      StartDate: request.startDate,
      EndDate: request.endDate,
      CourseFees: request.courseFees || 0,
      CourseType: request.courseType,
    };
    await Course.update(courseData, {
      where: { CourseID: request.courseId },
    });

    return success(res, "Course updated successfully");
  } catch (error) {
    console.error("updateCourse error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description List courses with pagination and search
 */
exports.listCourses = async (req, res) => {
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
      whereCondition[Op.or] = [{ CourseTitle: { [Op.substring]: search } }];
    }

    // Filter by Category or Year if provided
    if (request.CourseCategory)
      whereCondition.CourseCategory = request.CourseCategory;
    if (request.targetYear) whereCondition.TargetYear = request.targetYear;

    if (request.startDate && request.endDate) {
      whereCondition.StartDate = {
        [Op.between]: [new Date(request.startDate), new Date(request.endDate)],
      };
    }

    const courses = await Course.findAndCountAll({
      where: whereCondition,
      order: [["AddedOn", "DESC"]],
      limit: pageSize,
      offset: offset,
    });

    return success(res, "Courses fetched successfully", {
      courses: courses.rows,
      total: courses.count,
      page: page,
      limit: pageSize,
    });
  } catch (error) {
    console.error("listCourses error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Soft delete a course
 */
exports.deleteCourse = async (req, res) => {
  try {
    const request = await decrypter(req.body);

    if (!request.CourseID) return failed(res, "CourseID is required");

    const course = await Course.findOne({
      where: { CourseID: request.CourseID, IsDeleted: 0 },
    });

    if (!course) return failed(res, "Course not found");

    await Course.update(
      { IsDeleted: 1 },
      { where: { CourseID: request.CourseID } },
    );

    return success(res, "Course deleted successfully");
  } catch (error) {
    console.error("deleteCourse error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Toggle Course Status (Active/Inactive)
 */
exports.updateCourseStatus = async (req, res) => {
  try {
    // Decrypt the request body
    const request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    // Validation
    const v = new Validator(request, {
      CourseID: "required",
      Status: "required", // Ensure status is 0 or 1
    });

    if (await v.fails()) return failedValidation(res, v);

    // Check if course exists
    const course = await Course.findOne({
      where: { CourseID: request.CourseID, IsDeleted: 0 },
    });

    if (!course) return failed(res, "Course not found");

    // Update status
    await Course.update(
      { Status: request.Status },
      { where: { CourseID: request.CourseID } },
    );

    const statusMessage = request.Status == 1 ? "activated" : "deactivated";
    return success(res, `Course ${statusMessage} successfully`);
  } catch (error) {
    console.error("updateCourseStatus error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description List student mapped courses with pagination and search
 */
exports.listStudentCourses = async (req, res) => {
  try {
    let request = {};
    try {
      request = (await decrypter(req.query)) || req.query;
    } catch {
      request = req.query;
    }
    if (!request.search) return failed(res, "Please enter email or mobile!");

    const isStudent = await Student.findOne({
      where: {
        [Op.or]: [{ Mobile: request.search }, { EmailID: request.search }],
      },
      attributes: {
        exclude: ["Password", "IsDeleted", "StateID"],
      },
    });

    if (!isStudent) return failed(res, "Student not found!");
    const studentId = isStudent.ID;

    let pageSize = request.limit ? parseInt(request.limit) : 10;
    let page = request.page ? parseInt(request.page) : 1;
    let offset = pageSize * (page - 1);
    let search = request.search || "";
    let filter = request.filter || "";

    let whereCondition = {
      //   IsDeleted: 0,
    };

    if (filter) {
      const searchCourses = await Course.findAll({
        where: {
          CourseTitle: { [Op.substring]: filter },
        },
        attributes: ["CourseID"],
      });
      const courseIds = searchCourses.map((course) => course.CourseID);

      whereCondition[Op.or] = [{ courseid: { [Op.in]: courseIds } }];
    }

    // // Filter by Category or Year if provided
    // if (request.CourseCategory)
    //   whereCondition.CourseCategory = request.CourseCategory;
    // if (request.targetYear) whereCondition.TargetYear = request.targetYear;

    // if (request.startDate && request.endDate) {
    //   whereCondition.StartDate = {
    //     [Op.between]: [new Date(request.startDate), new Date(request.endDate)]
    //   };
    // }

    if (studentId) {
      whereCondition = {
        ...whereCondition,
        studentid: studentId,
      };
    }

    const courses = await StudentCourses.findAndCountAll({
      where: whereCondition,
      order: [["AddedOn", "DESC"]],

      include: [
        {
          model: Student,
          as: "students",
          attributes: [["ID", "StudentId"], "Name", "Mobile", "EmailID"],
        },
        {
          model: Course,
          as: "courses",
          attributes: [
            "CourseID",
            "CourseTitle",
            "StartDate",
            "EndDate",
            "TargetYear",
          ],
          where: {
            status: true,
            IsDeleted:0
          },
        },
      ],
      limit: pageSize,
      offset: offset,
    });

    return success(res, "Student Courses fetched successfully", {
      studentCourses: courses.rows,
      studentInfo: isStudent,
      total: courses.count,
      page: page,
      limit: pageSize,
    });
  } catch (error) {
    console.error("listCourses error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Course dropdown with pagination and search
 */
exports.courseDropdown = async (req, res) => {
  try {
    let request = {};
    try {
      request = (await decrypter(req.query)) || req.query;
    } catch {
      request = req.query;
    }

    const courses = await Course.findAll({
      where: { IsDeleted: 0, status: true },
      order: [["CourseTitle", "ASC"]],
      attributes: [
        ["CourseID", "value"],
        ["CourseTitle", "label"],
        "StartDate",
        "EndDate",
      ],
    });

    return success(res, "Student Courses fetched successfully", {
      courses,
    });
  } catch (error) {
    console.error("courseDropdown error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Test dropdown with pagination and search
 */
exports.testDropdown = async (req, res) => {
  try {
    let request = {};
    try {
      request = (await decrypter(req.query)) || req.query;
    } catch {
      request = req.query;
    }

    const tests = await Test.findAll({
      where: { IsDeleted: 0 },
      order: [["TestTitle", "ASC"]],
      attributes: [
        ["TestID", "value"],
        ["TestTitle", "label"],
      ],
      include: [
        {
          model: TestType,
          as: "TestType",
          attributes: ["ID", "TestType"],
        },
      ],
      raw: true,
      nest: true,
    });

    return success(res, "Tests fetched successfully", {
      tests,
    });
  } catch (error) {
    console.error("testsDropdown error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Student Course Details with pagination and search
 */
exports.studentCourseDetails = async (req, res) => {
  try {
    let request = {};
    try {
      request = (await decrypter(req.query)) || req.query;
    } catch {
      request = req.query;
    }

    if (!request.search)
      return failed(res, "Please enter student email or mobile");

    const isStudent = await Student.findOne({
      where: {
        [Op.or]: [{ Mobile: request.search }, { EmailID: request.search }],
      },
    });

    if (!isStudent) return failed(res, "Student not found!");
    const studentId = isStudent.ID;

    const student = await Student.findOne({
      where: {
        ID: studentId,
      },
      attributes: {
        exclude: ["Password", "IsDeleted", "StateID"],
      },
    });

    const courses = await StudentCourses.findAll({
      where: {
        studentid: studentId,
      },
      attributes: ["courseid", "studentid", "AddedOn"],
      include: [
        {
          model: Course,
          as: "courses",
          attributes: [
            "CourseID",
            "CourseTitle",
            "StartDate",
            "EndDate",
            "TargetYear",
          ],
          where:{
            status:true,
            IsDeleted:0
          }
        },
      ],
    });

    return success(res, "Student verified successfully", { student, courses });
  } catch (error) {
    console.error("courseDropdown error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Map Course To Student
 */
exports.mapCourseToStudent = async (req, res) => {
  try {
    // Decrypt the request body
    const request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    // Validation
    const v = new Validator(request, {
      studentId: "required",
      // courses: "required", // Ensure status is 0 or 1
    });

    if (await v.fails()) return failedValidation(res, v);

    // Check if course exists
    const student = await Student.findOne({
      where: { ID: request.studentId, IsDeleted: 0 },
    });

    if (!student) return failed(res, "Student not found");
    const courses = request.courses || [];
    if (courses.length > 0) {
      courses.map((courseId) =>
        StudentCourses.findOrCreate({
          where: {
            studentid: request.studentId,
            courseid: courseId,
          },
        }),
      );
    } else {
      await StudentCourses.destroy({
        where: {
          studentid: request.studentId,
        },
      });
      return success(res, `Courses un-assigned successfully`);
    }
    return success(res, `Courses assigned successfully`);
  } catch (error) {
    console.error("mapCourseToStudent error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description List test mapped courses with pagination and search
 */
exports.listCourseTests = async (req, res) => {
  try {
    let request = {};
    try {
      request = (await decrypter(req.query)) || req.query;
    } catch {
      request = req.query;
    }
    if (!request.course) return failed(res, "Course is required");

    const isCourse = await Course.findOne({
      where: {
        CourseID: request.course,
      },
      attributes: [
        "CourseID",
        "CourseTitle",
        "StartDate",
        "EndDate",
        "TargetYear",
      ],
    });

    if (!isCourse) return failed(res, "Course not found!");
    const courseId = isCourse.dataValues.CourseID;

    let pageSize = request.limit ? parseInt(request.limit) : 10;
    let page = request.page ? parseInt(request.page) : 1;
    let offset = pageSize * (page - 1);
    let search = request.search || "";
    let filter = request.filter || "";

    const availableTests = await Test.findAll({
      where:{
        IsDeleted:0
      }
    }) 
    const availableTestids= availableTests.map((course) => course.TestID)
    let whereCondition = {
      TestID: { [Op.in]: availableTestids }
    };
    if (search) {
      const searchTests = await Test.findAll({
        where: {
          TestTitle: { [Op.substring]: search },
          IsDeleted:0
        },
        attributes: ["TestID"],
      });
      const testIds = searchTests.map((course) => course.TestID);

      whereCondition[Op.or] = [{ TestID: { [Op.in]: testIds } }];
    }

    // // Filter by Category or Year if provided
    // if (request.CourseCategory)
    //   whereCondition.CourseCategory = request.CourseCategory;
    // if (request.targetYear) whereCondition.TargetYear = request.targetYear;

    if (request.startDate && request.endDate) {
      whereCondition.scheduleDate = {
        [Op.between]: [new Date(request.startDate), new Date(request.endDate)],
      };
    }

    if (courseId) {
      whereCondition = {
        ...whereCondition,
        CourseID: courseId,
      };
    }
    const tests = await TestCourses.findAndCountAll({
      where: whereCondition,
      order: [["AddedOn", "DESC"]],
      attributes: [
        "TestID",
        "CourseID",
        "TestSubType",
        "ValidDate",
        "customscheduleDate",
        "scheduleDate",
        "customId",
        "TestType",
        "status",
        "AddedOn",
      ],
      limit: pageSize,
      offset: offset,
    });

    const formatCouseTests = await Promise.all(
      tests.rows.map(async (data) => {
        const test = await Test.findOne({
          where: { TestID: data.TestID },
          attributes: ["TestID", "TestTitle", "TestTypeID"],
        });

        return {
          ...data.dataValues,
          testTitle: test.TestTitle,
          testTypeID: test.TestTypeID,
        };
      }),
    );

    return success(res, "Courses tests fetched successfully", {
      testCourses: formatCouseTests,
      courseInfo: isCourse,
      total: tests.count,
      page: page,
      limit: pageSize,
    });
  } catch (error) {
    console.error("listCourseTests error:", error);
    return failed(res, error.message);
  }
};

/**
 * @description Map Test To Course
 */
exports.mapTestToCourse = async (req, res) => {
  try {
    // Decrypt the request body
    const request = await decrypter(req.body);
    if (!request) return failed(res, "Internal server error");

    // Validation
    const v = new Validator(request, {
      courseId: "required",
      // courses: "required", // Ensure status is 0 or 1
    });

    if (await v.fails()) return failedValidation(res, v);

    // Check if course exists
    const course = await Course.findOne({
      where: { CourseID: request.courseId },
    });

    if (!course) return failed(res, "Course not found");

    const tests = request.testIds || [];
    if (tests.length > 0) {
      await Promise.all(
        tests.map(async ({ id, testType, scheduleDate, validDate }) => {
          const testLanguages = await TestLanguages.findAll({
            where: { TestID: id },
          });
          const testLangs = testLanguages
            .map((lang) => lang.LanguageID) // change field name if needed
            .join(",");

          const [record, created] = await TestCourses.findOrCreate({
            where: {
              TestID: id,
              CourseID: request.courseId,
              language: testLangs,
            },
            defaults: {
              TestType: testType,
              scheduleDate,
              ValidDate: validDate,
              customscheduleDate: scheduleDate,
            },
          });

          // 👇 If record already exists → update it
          if (!created) {
            await record.update(
              {
                TestType: testType,
                scheduleDate,
                ValidDate: validDate,
                customscheduleDate: scheduleDate,
              },
              {
                where: {
                  TestID: id,
                  CourseID: request.courseId,
                  // language: testLangs,
                },
              },
            );
          }

          return {
            // test,
            // testType,
            // testLangs,
          };
        }),
      );
    } else {
      await TestCourses.destroy({
        where: {
          CourseID: request.courseId,
        },
      });
      return success(res, `Tests un-assigned successfully`);
    }
    return success(res, `Tests assigned successfully`);
  } catch (error) {
    console.error("mapTestToCourse error:", error);
    return failed(res, error.message);
  }
};
