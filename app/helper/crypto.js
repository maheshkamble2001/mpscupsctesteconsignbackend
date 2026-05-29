const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const inputEncoding = 'utf8';
const outputEncoding = 'hex';
const { dump } = require("../helper/logs");
const iv = crypto.randomBytes(16);
const axios = require("axios");

module.exports = {
    encrypter: (data) => {
        if (process.env.ENCRYPTION == 'true') {
            var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.ENCRYPTION_SECRET).toString();
            return ciphertext;
        } else {
            return data;
        }
    },

    decrypter: async (data) => {
        try {
            if (process.env.ENCRYPTION == 'true') {
                if (data.reqData) {
                    var string = data.reqData;
                    var a = string.replace(/ /g, '+');

                    var bytes = CryptoJS.AES.decrypt(a, process.env.ENCRYPTION_SECRET);
                    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    if (decryptedData) {
                        return decryptedData;
                    } else {
                        return false;
                    }
                } else if (data) {
                    var string = data;
                    var a = string.replace(/ /g, '+');

                    var bytes = CryptoJS.AES.decrypt(a, process.env.ENCRYPTION_SECRET);
                    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                    if (decryptedData) {
                        return decryptedData;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return data;
            }
        } catch (error) {
            dump("error", error);
        }
    },

    ///////////Password Encryption //////////////
    passwordEncrypter: (data, status = 200, message = 'test') => {
        // if (process.env.ENCRYPTION == 'true') {
        //     var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.PASSWORD_SECRET).toString();
        //     return ciphertext;
        // } else {
        //     return data;
        // } 
        let key = "12345678123456781234567812345678";
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        console.log({
            iv: iv.toString('hex'),
            content: encrypted.toString('base64')
        });
        return {
            iv: iv.toString('hex'),
            content: encrypted.toString('base64')
        };
    },
    ///////////Password Decryption //////////////
    passwordDecrypter: (data) => {
        if (process.env.ENCRYPTION == 'true') {
            var bytes = CryptoJS.AES.decrypt(data, process.env.PASSWORD_SECRET);
            var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            return decryptedData;
        } else {
            return data;
        }
    },

    dotNetPasswordEncrypt: async (data) => {
        let res = await axios.post(`http://srbilling.shubhraviraj.in/bapi/account/encrypt-string`, {
            Requesttext: data
        }, {
            headers: {
                API_KEY: process.env.SK_CLIENT1
            }
        })
        return res.data.Resultstring
    },

    dotNetPasswordDecrypt: async (data) => {
        let res = await axios.post(`http://srbilling.shubhraviraj.in/bapi/account/decrypt-string`, {
            Requesttext: data
        }, {
            headers: {
                API_KEY: process.env.SK_CLIENT1
            }
        })
        return res.data.Resultstring
    },
    dotNetPasswordencryptor: async (clearText) => {
        const EncryptionKey = 'MAKV2SPBNI99212';
        const salt = Buffer.from([0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76]);

        // Derive key and IV using PBKDF2 (like Rfc2898DeriveBytes)
        const keyIv = crypto.pbkdf2Sync(EncryptionKey, salt, 1000, 48, 'sha1');
        const key = keyIv.slice(0, 32);   // first 32 bytes for key
        const iv = keyIv.slice(32, 48);   // next 16 bytes for IV

        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(clearText, 'utf16le', 'base64'); // Unicode = UTF-16LE
        encrypted += cipher.final('base64');

        return encrypted;

    },
    dotNetPasswordDecryptor: async (encryptedText) => {
        const EncryptionKey = 'MAKV2SPBNI99212';
        const salt = Buffer.from([
            0x49, 0x76, 0x61, 0x6e, 0x20,
            0x4d, 0x65, 0x64, 0x76, 0x65,
            0x64, 0x65, 0x76
        ]);

        // Derive key and IV exactly like Encryptor
        const keyIv = crypto.pbkdf2Sync(EncryptionKey, salt, 1000, 48, 'sha1');
        const key = keyIv.slice(0, 32);
        const iv = keyIv.slice(32, 48);

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText, 'base64', 'utf16le');
        decrypted += decipher.final('utf16le');

        return decrypted;
    }
}