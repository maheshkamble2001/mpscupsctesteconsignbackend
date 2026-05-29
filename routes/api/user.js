const express = require('express');
const router = express.Router();
const auth = require('../../app/middleware/adminAuth');

let LoginController = require('../../app/controller/v1/user/LoginController');
let TestController = require('../../app/controller/v1/user/TestController');

router.post("/student-login", LoginController.studentLogin);
router.get("/test-list", TestController.GetTestList);
router.get("/test-by-id", TestController.GetTestbyId);
router.get("/student-tests-list", TestController.listStudentTests);


router.post("/upload-question-by-excel", TestController.uploadTestQuestionsByExcel);

module.exports = router;