const AWS = require("aws-sdk");
const {
    S3
} = require("@aws-sdk/client-s3");
const {
    Upload
} = require("@aws-sdk/lib-storage");
const path = require("path");
const {
    v4
} = require('uuid');
const {
    dump
} = require("./logs");



exports.aws = async function (file, folderName = null) {
    try {
        if (process.env.AWS == 'true') {

            // const client = new S3({
            //     accessKeyId: process.env.AWS_ACCESS_KEY,
            //     secretAccessKey: process.env.AWS_SECRET_KEY,
            //     region: process.env.AWS_BUCKET_REGION || "ap-south-1",
            // });
            // const s3 = new AWS.S3({
            //     accessKeyId: process.env.AWS_ACCESS_KEY,
            //     secretAccessKey: process.env.AWS_SECRET_KEY,
            //     region: process.env.AWS_BUCKET_REGION || "ap-south-1",
            // });

            var ext = path.extname(file.name);

            // const params = {
            //     Bucket: process.env.AWS_BUCKET_NAME,
            //     //  Key: Date.now() + ext, // File name you want to save as in S3
            //     Key: "svr/" + Date.now() + ext, // File name you want to save as in S33
            //     Body: file.data,
            // };

            // const multipartUpload = new Upload({
            //     client: new S3({
            //         accessKeyId: process.env.AWS_ACCESS_KEY,
            //         secretAccessKey: process.env.AWS_SECRET_KEY,
            //         region: process.env.AWS_BUCKET_REGION || "ap-south-1",
            //     }),
            //     params: {
            //         Bucket: process.env.AWS_BUCKET_NAME,
            //         Key: "svr/" + v4() + Date.now() + ext,
            //         Body: file.data
            //     },
            // });

            // return multipartUpload.params;
            const s3 = new AWS.S3({
                accessKeyId: folderName ? process.env.AWS_ACCESS_KEY : process.env.PUBLIC_AWS_ACCESS_KEY, 
                secretAccessKey: folderName ? process.env.AWS_SECRET_KEY : process.env.PUBLIC_AWS_SECRET_KEY,
                region: process.env.AWS_BUCKET_REGION,
            });
            let extension = file.mimetype.split("/");
            let imgPath = "";
            if (folderName) {
                imgPath = folderName  + Date.now() + "." + extension[1];
            } else {
                imgPath = "svr/" + Date.now() + "." + extension[1];
            }
            let params = {
                Bucket: folderName ? process.env.AWS_BUCKET_NAME : process.env.PUBLIC_AWS_BUCKET_NAME,
                Key: imgPath,
                Body: file.data,
                ContentType: file.mimetype
            };
            // if (extension == 'pdf') {
            //     params = Object.assign(params, {
            //         ContentType : "application/pdf"
            //     })
            // }
            return new Promise((resolve, reject) => {
                s3.upload(params, function (err, data) {
                    if (err) {
                        console.log("error", err);
                        return Promise.reject(err);
                    }
                    return resolve(data);
                });
            });

        } else {
            var ext = path.extname(file.name);

            let fileName = v4() + Date.now() + ext;
            var base_path = __basedir
            file.mv(base_path + "/storage/images/" + fileName);

            return {
                Key: fileName
            };
        }
        // const getObjectResult = await client.getObject({
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: "svr/" + Date.now() + ext,
        //     Body: file.data
        // });
        // return new Promise((resolve, reject) => {
        //     s3.upload(params, function (err, data) {
        //         if (err) {
        //             return Promise.reject(err);
        //         }
        //         return resolve(data);
        //     });
        // }).catch((err) => {
        //     console.log(err);
        //     return Promise.reject(err);
        // });
    } catch (error) {
        dump("error", error)
    }
};

exports.signedUrl = async (pdfurl) => {
    try {
        // Configure AWS SDK
        if(pdfurl == ""){
            return pdfurl;
        }
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
            region: process.env.AWS_BUCKET_REGION,
        });

        // Create an S3 instance
        const s3 = new AWS.S3();

        // Set the bucket name, key (path to the object), and expiration time
        const bucketName = process.env.AWS_BUCKET_NAME
        const newUrl = pdfurl.replace(process.env.AWS_IMAGE_URL, "")
        const key = newUrl;
        const expires = process.env.PDF_EXPIRY_TIME * 60; // URL expiration time in seconds

        // Generate a pre-signed URL
        const url = s3.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: key,
            Expires: expires,
            // Protocol: 'https'
        });
        return url;
    } catch (error) {
        dump(error, 'signed url error')
    }
}

exports.mobsignedUrl = async (pdfurl) => {
    try {
        // Configure AWS SDK
        if(pdfurl == ""){
            return pdfurl;
        }
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
            region: process.env.AWS_BUCKET_REGION,
        });

        // Create an S3 instance
        const s3 = new AWS.S3();

        // Set the bucket name, key (path to the object), and expiration time
        const bucketName = process.env.AWS_BUCKET_NAME
        const newUrl = pdfurl.replace(process.env.AWS_IMAGE_URL, "")
        const key = newUrl;
        const expires = process.env.PDF_EXPIRY_TIME * 60; // URL expiration time in seconds

        // Generate a pre-signed URL
        const url = s3.getSignedUrl('getObject', {
            Bucket: bucketName,
            Key: key,
            Expires: expires,
            // Protocol: 'https'
        });
        return url;
    } catch (error) {
        dump(error, 'signed url error')
    }
}