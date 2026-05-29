const CryptoJS = require("crypto-js");

const crypto = require('crypto');
let {
  dump
} = require('../../../../helper/logs');

exports.encryption = async function (req, res) {
  try {
    let secret_key = req.headers.secret_key;
    let checkLength = Object.keys(req.body).length;

    if (checkLength == 0) {
        res.json("Input is required.");
    }

    var ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(req.body),
      secret_key
    ).toString();
    res.json(ciphertext);

  } catch (error) {
    dump("error", error);
  }
};

exports.decryption = async function (req, res) {
  try {
    let secret_key = req.headers.secret_key;
    let checkLength = Object.keys(req.body).length;
    if (checkLength == 0 || !req.body.reqData) {
        res.json("Input is required.");
    }
    var bytes = CryptoJS.AES.decrypt(req.body.reqData, secret_key);
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    res.json(decryptedData);
  } catch (error) {
    console.log("error", error);
  }
};


exports.iciciencryption = async function (req, res) {
  try {
    let key = req.headers.secret_key;
    let checkLength = Object.keys(req.body).length;
    let data = req.body.reqData;

    const keyBuffer = Buffer.from(key, 'utf8');
    const dataBuffer = Buffer.from(data, 'utf8');

    // Create AES encryption algorithm with ECB mode
    const cipher = crypto.createCipheriv('aes-128-ecb', keyBuffer, Buffer.alloc(0));

    // Perform encryption
    let encryptedBase64 = cipher.update(dataBuffer, 'utf8', 'base64');
    encryptedBase64 += cipher.final('base64');


    
    res.json(encryptedBase64);

  } catch (error) {
  }
};

exports.icicidecryption = async function (req, res) {
  try {
    let secret_key = req.headers.secret_key;
    console.log(secret_key);
    console.log(req.body.reqData);
    
    const keyBuffer = Buffer.from(secret_key, 'utf8');

    // Convert Base64 encoded encrypted data to buffer
    const encryptedBuffer = Buffer.from(req.body.reqData, 'base64');

    // Create AES decryption algorithm with ECB mode
    const decipher = crypto.createDecipheriv('aes-128-ecb', keyBuffer, Buffer.alloc(0));

    // Perform decryption
    let decryptedData = decipher.update(encryptedBuffer, 'binary', 'utf8');
    decryptedData += decipher.final('utf8');
    console.log(decryptedData);
    
    res.json(decryptedData);

  } catch (error) {
  }
};