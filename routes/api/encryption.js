var express = require('express');
var auth = require('../../app/middleware/adminAuth');
var router = express.Router();
let AesEncryptionController = require('../../app/controller/v1/admin/encryption/AesEncryptionController')


router.post("/aes-encryption", AesEncryptionController.encryption);
router.post("/aes-decryption", AesEncryptionController.decryption);

module.exports = router;