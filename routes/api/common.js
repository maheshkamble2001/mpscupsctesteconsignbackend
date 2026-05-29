const express = require('express');
const router = express.Router();
const auth = require('../../app/middleware/adminAuth');

// Controllers
const CommonController = require('../../app/controller/v1/common/CommonController');

router.get('/test-type', CommonController.listActiveTestTypes);
router.get('/exam-type', CommonController.listActiveExamTypes);

module.exports = router;