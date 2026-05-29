const CryptoJS = require('crypto-js');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require("path");
const request = require('request')
const AWS = require("aws-sdk");
const subProcess = require('child_process')
const {
    decrypter
} = require('../helper/crypto');
let {
    success,
    failed,
    failedValidation
} = require('../helper/response');
const sgMail = require('@sendgrid/mail');
const {
    dump
} = require('../helper/logs');
const apiKEY = 'xCxLqUF5s3epEVbdsnDKCPjCU7JtDs5R3ogbwuXxc8kC5eWFXq7qAfDfVtRrPg2b';
// var s3 = new AWS.S3();
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
});
function getS3File(bucket, key) {
    return new Promise(function (resolve, reject) {
        s3.getObject(
            {
                Bucket: bucket,
                Key: key
            },
            function (err, data) {
                if (err) return reject(err);
                else return resolve(data);
            }
        );
    })
}
exports.encryption = async function (req, res) {
    var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(req.body), process.env.ENCRYPTION_SECRET).toString();
    res.json(ciphertext)
}

exports.decryption = async function (req, res) {
    try {
        var bytes = CryptoJS.AES.decrypt((req.body.reqData), process.env.ENCRYPTION_SECRET);
        var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        res.json(decryptedData)
    } catch (error) {
        dump("error", error)
    }
}

exports.testShell = async function (req, res) {
    try {
        subProcess.exec('ls', (err, stdout, stderr) => {
            if (err) {
                console.error(err)
                process.exit(1)
                res.json("test")
            } else {
                for (let index = 0; index < 10000000000000; index++) {
                    console.log(`Test ${index}`)                    
                }
                // console.log(`The stdout Buffer from shell: ${stdout.toString()}`)
                // console.log(`The stderr Buffer from shell: ${stderr.toString()}`)
                res.json("test2")
            }
        })
        res.json("test3")
    } catch (error) {
        dump("error", error)
    }
}

// exports.videoCipher = async function (req, res) {
//     try {
//         var options = {
//             method: "PUT",
//             url: "https://dev.vdocipher.com/api/videos",
//             qs: {
//                 title: "title"
//             },
//             headers: {
//                 Authorization: `Apisecret ${apiKEY}`
//             },
//         };
//         request(options, function (error, response, body) {
//             if (error) return failed(res, error.message);
//             let responsData = JSON.parse(body);
//             var options = {
//                 method: "POST",
//                 url: responsData.clientPayload.uploadLink,
//                 headers: {
//                     "content-type": "multipart/form-data"
//                 },
//                 formData: {
//                     policy: responsData.clientPayload.policy,
//                     key: responsData.clientPayload.key,
//                     success_action_status: "201",
//                     success_action_redirect: "",
//                     file: {
//                         value: req.files.video.data,
//                         options: {
//                             filename: "1684311657516.mp4",
//                             contentType: null
//                         },
//                     }

//                 },
//             };

//             request(options, function (error, response, body) {
//                 if (error)
//                     return failed(res, error.message);
//                 return success(res, 'Success', body);



//             });
//         });
//     } catch (error) {
//         dump("error", error)
//     }
// }

exports.sendSendGridMailWithAttachment = async function (newdata) {
    try {
        dump({ newdata })
        let data = {};

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        let getS3Object = await getS3File(process.env.AWS_BUCKET_NAME, 'invoice/e2365b24-335e-431b-a6cd-37b1bed38f1a.pdf')
        // var requests = await decrypter(req.body);
        // if (requests == false) {
        //     return failed(res, "Internal server error");
        // }
        let textBuffered = await axios.get(`${newdata.url}`, { responseType: 'arraybuffer' })
        // let textBuffered = await axios.get('https://ride-chef-dev.s3.ap-south-1.amazonaws.com/invoice/e2365b24-335e-431b-a6cd-37b1bed38f1a.pdf', { responseType: 'arraybuffer' })
        // dump({textBuffered})
        pathToAttachment = textBuffered.data;
        // attachment = fs.readFileSync(pathToAttachment).toString("base64");
        let attachment = []
        const attachObj = {
            content: pathToAttachment.toString("base64"),
            filename: `invoice.pdf`,
            type: "application/pdf",
            disposition: "attachment",
            content_id: "mytext",
        };
        attachment.push(attachObj);

        // attachment = fs.readFileSync(getS3Object).toString("base64");
        // dump({ attachment })
        const msg = {
            to: newdata.email,
            nickname: "smart move",
            from: {
                "email": "admin@smartmove.com",
                "name": "smart move"
            },
            dynamicTemplateData: {
                url: newdata.url,
                user_name: newdata.user_name
            },
            templateId: newdata.templateId,
            // dynamicTemplateData: {
            //     url: url,
            //     user_name: userData.FirstName
            // },
            attachments: attachment
        };

        var m = await sgMail.send(msg)
        // return success(res, 'Success', data);
        return true;
    } catch (error) {
        dump("error", error)
        // return failed(res, error.message);
    }
}

exports.videoCipher = async function (req, res) {
    try {
        //Obtain credentials before upload start here
        var options = {
            method: "PUT",
            url: "https://dev.vdocipher.com/api/videos",
            qs: {
                title: "title"
            },
            headers: {
                Authorization: `Apisecret ${apiKEY}`
            },
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            console.log(JSON.parse(body));
            //Obtain credentials before upload end here
            let responsData = JSON.parse(body);

            //Uploading File using Credentials start here
            var options = {
                method: "POST",
                url: responsData.clientPayload.uploadLink,
                headers: {
                    "content-type": "multipart/form-data"
                },
                formData: {
                    policy: responsData.clientPayload.policy,
                    key: responsData.clientPayload.key,
                    "x-amz-signature": responsData.clientPayload['x-amz-signature'],
                    "x-amz-algorithm": responsData.clientPayload['x-amz-algorithm'],
                    "x-amz-date": responsData.clientPayload['x-amz-date'],
                    "x-amz-credential": responsData.clientPayload['x-amz-credential'],
                    success_action_status: "201",
                    success_action_redirect: "",
                    file: {
                        value: req.files.video.data,
                        options: {
                            filename: "1684311657516.mp4",
                            contentType: null
                        },
                    }

                },
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                console.log(body);
            });
            //Uploading File using Credentials end here

        });
    } catch (error) {
        dump("error", error)
    }
}