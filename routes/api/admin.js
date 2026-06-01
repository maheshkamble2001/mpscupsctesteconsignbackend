const express = require("express");
const router = express.Router();
const auth = require("../../app/middleware/adminAuth");

// Controllers
const LoginController = require("../../app/controller/v1/admin/LoginController");
const UsertypeController = require("../../app/controller/v1/admin/UsertypeController");
const UserController = require("../../app/controller/v1/admin/UserController");
const MenuAccessCodesController = require("../../app/controller/v1/admin/MenuAccessCodesController");
const StudentController = require("../../app/controller/v1/admin/StudentController");
const TesttypeController = require("../../app/controller/v1/admin/TesttypeController");
const TestController = require("../../app/controller/v1/admin/TestController");
const McqQuestionController = require("../../app/controller/v1/admin/McqQuestionController");
const ExamTypeController = require("../../app/controller/v1/admin/ExamTypeController");
const DailyQuizController = require("../../app/controller/v1/admin/DailyQuizController");
const CourseController = require("../../app/controller/v1/admin/CourseController");
const SubjectController = require("../../app/controller/v1/admin/SubjectController");
const QuestionController = require("../../app/controller/v1/admin/QuestionController");
const ExamController = require("../../app/controller/v1/admin/ExamController");
const ExamCourseController = require("../../app/controller/v1/admin/ExamCourseController");

router.post("/login", LoginController.login);
router.post("/forgot-Password", LoginController.forgotPassword);
router.post("/reset-Password", LoginController.resetPasword);
router.post("/change-password", auth, LoginController.changePassword);

//user
router.post("/user-create", auth, UserController.createUser);
router.post("/user-edit", auth, UserController.editUser);
router.post("/user-delete", auth, UserController.deleteUser);
router.get("/users-all-list", auth, UserController.listUsers);
router.post("/user-status", auth, UserController.statusUser);
router.get("/user-details", auth, UserController.getUserDetails);
//usertype routes
router.post("/usertype-create", auth, UsertypeController.createUserType);
router.post("/usertype-edit", auth, UsertypeController.editUserType);
router.get("/usertype-list", auth, UsertypeController.listUserTypes);
router.get(
  "/usertype-active-list",
  auth,
  UsertypeController.listActiveUserTypes,
);
router.post("/usertype-status", auth, UsertypeController.statusUserType);
router.post("/usertype-delete", auth, UsertypeController.deleteUserType);

router.get("/state-dropdown", auth, UserController.listStates);

router.get("/menuaccesscodes-list", auth, MenuAccessCodesController.getMenuAccessCodesList,);
router.post("/menuaccesscodes-add", auth, MenuAccessCodesController.addMenuAccessCodes,);
router.post("/menuaccesscodes-edit", auth, MenuAccessCodesController.UpdateMenuAccessCodes,);
router.post("/menuaccesscodes-delete", auth, MenuAccessCodesController.DeleteMenuAccessCodes,);
router.post("/menuaccesscodes-status", auth, MenuAccessCodesController.StatusUpdateMenuAccessCodes,);
router.get("/menuaccesscodes-by-id", auth, MenuAccessCodesController.GetMenuAccessCodesByID,);

// Menu Modules
router.get("/menumodules-dropdown", auth, MenuAccessCodesController.getMenuModulesDropDownList,);
router.get("/list-menuaccess-with-module", auth, MenuAccessCodesController.getMenuAccessCodesListWithModules,);
router.get("/list-roles-with-module", auth, MenuAccessCodesController.getRolesWithModules,);
//  User Roles
router.get("/userrole-dropdown", auth, MenuAccessCodesController.getUserRoledropdownList,);

// Role Access
router.get("/roleaccess-list", auth, MenuAccessCodesController.Getroleaccesslist,);
router.get("/unassigned-roleaccess", auth, MenuAccessCodesController.getUnassignedRoleAccessCodes,);
router.post("/assign-roleaccess", auth, MenuAccessCodesController.assignAccessCodesToRole,);
router.post("/delete-roleaccess", auth, MenuAccessCodesController.deleteAssignedRoleAccess,);

// Student routes
router.post("/student-create", auth, StudentController.createStudent);
router.post("/student-edit", auth, StudentController.editStudent);
router.post("/student-delete", auth, StudentController.deleteStudent);
router.get("/students-all-list", auth, StudentController.listStudents);
router.post("/student-status", auth, StudentController.statusStudent);
router.get("/student-details", auth, StudentController.getStudentDetails);

// Test Type routes
router.post("/testtype-create", auth, TesttypeController.createTestType);
router.post("/testtype-edit", auth, TesttypeController.editTestType);
router.get("/testtypes-list", auth, TesttypeController.listTestTypes);
router.get("/testtype-active-list", auth, TesttypeController.listActiveTestTypes,);
router.post("/testtype-status", auth, TesttypeController.statusTestType);
router.post("/testtype-delete", auth, TesttypeController.deleteTestType);

// Test routes
router.post("/test-create", auth, TestController.createTest);
router.post("/test-edit", auth, TestController.editTest);
router.post("/test-delete", auth, TestController.deleteTest);
router.get("/tests-all-list", auth, TestController.listTests);
router.post("/test-status", auth, TestController.statusTest);

router.post("/mcqquestion-create", auth, McqQuestionController.addMcqQuestions);
router.post("/mcqquestion-edit", auth, McqQuestionController.updateMcqQuestions,);
router.post(
  "/mcqquestion-delete",
  auth,
  McqQuestionController.deleteMcqQuestion,
);
router.get("/mcqquestions-list", auth, McqQuestionController.listMcqQuestions);
router.get("/mcqquestions-all-languages", auth, McqQuestionController.getQuestionAllLanguages,);
router.post("/upload-mcq-questions", auth, McqQuestionController.ImportMcqQuestions,);
router.post(
  "/delete-mcq-questions",
  auth,
  McqQuestionController.ImportMcqQuestions,
);
router.post(
  "/delete-multiple-mcq-questions",
  auth,
  McqQuestionController.deleteMultipleMcqQuestion,
);

router.get(
  "/languages-dropdown",
  auth,
  McqQuestionController.dropdownLanguages,
);

router.post("/examtype-create", auth, ExamTypeController.createExamType);
router.post("/examtype-edit", auth, ExamTypeController.editExamType);
router.get("/examtypes-list", auth, ExamTypeController.listExamTypes);
router.get("/examtype-active-list", auth, ExamTypeController.listActiveExamTypes,);
router.post("/examtype-status", auth, ExamTypeController.changeExamTypeStatus);
router.post("/examtype-delete", auth, ExamTypeController.deleteExamType);
router.get("/examtype-dropdown", auth, ExamTypeController.getExamTypeDropdown);

router.get("/exams-list", auth, ExamController.listExams);
router.post("/exam-create", auth, ExamController.createExam);
router.post("/exam-edit", auth, ExamController.updateExam);
router.post("/exam-delete", auth, ExamController.deleteExam);
router.post("/exam-show-in-catalogue-status", auth, ExamController.toggleShowInCatalogue);
router.post("/exam-free-trial-status", auth, ExamController.toggleAllFreeTrial);
router.post("/exam-open-enrollment-status", auth, ExamController.toggleOpenEnrollment);
router.get("/exam-dropdown", auth, ExamController.examDropdown);

router.get("/exam-courses-list", auth, ExamCourseController.listCourses);

//daily quiz
router.get("/dailyquiz/list", auth, DailyQuizController.getDailyQuiz);
router.get("/dailyquiz/delete", auth, DailyQuizController.deleteDailyQuiz);
router.get("/dailyquiz/details", auth, DailyQuizController.getDailyQuizDetails);
router.post("/dailyquiz/create", auth, DailyQuizController.createDailyQuiz);
router.get("/dailyquiz-by-id", auth, DailyQuizController.getDailyQuizDetails);

//courses
router.get("/courses/list", auth, CourseController.listCourses);
router.get("/courses/dropdown", auth, CourseController.courseDropdown);
router.post("/courses/add-course", auth, CourseController.addCourse);
router.post("/courses/edit-course", auth, CourseController.updateCourse);
router.post("/courses/delete-course", auth, CourseController.deleteCourse);
router.post("/courses/update-course-status", auth, CourseController.updateCourseStatus,);

// Subject routes
router.post("/subjects-add", auth, SubjectController.createSubject);
router.post("/subjects-edit", auth, SubjectController.updateSubject);
router.post("/subjects-delete", auth, SubjectController.deleteSubject);
router.get("/subjects-list", auth, SubjectController.listSubjects);
router.get("/subjects-dropdown", auth, SubjectController.getSubjectDropdown);

router.get("/student-courses/list", auth, CourseController.listStudentCourses);
router.get("/student-courses/details", auth, CourseController.studentCourseDetails,);
router.post("/student-courses/assign-courses", auth, CourseController.mapCourseToStudent,);

router.get("/test-courses/dropdown", auth, CourseController.testDropdown);
router.get("/test-courses/list", auth, CourseController.listCourseTests);
router.get("/test-courses/details", auth, CourseController.studentCourseDetails);
router.post("/test-courses/assign-tests", auth, CourseController.mapTestToCourse);

router.get("/questions-bank/list", auth, QuestionController.listQuestions);
router.post("/questions-bank/delete", auth, QuestionController.deleteQuestion);
router.post("/questions-bank/add", auth, QuestionController.createQuestion);
router.post("/questions-bank/edit", auth, QuestionController.updateQuestion);

module.exports = router;
