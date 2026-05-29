let Admin = require('../../models').tbl_adminusers;
let User = require('../../models').tbl_webusers;
let BillingTransactions = require('../../models').tbl_BillingTransactions;
let BillingTransactionAddon = require('../../models').tbl_billingtransactionaddon;
let Billingcourse = require('../../models').tbl_billingcources;
const jwt = require("jsonwebtoken");
const { decrypter } = require('./crypto');
const { dump } = require('./logs');
const fs = require('fs');
var html_to_pdf = require('html-pdf-node');
const path = require('path');
const { failed } = require('./response');
const {
    Op
} = require("sequelize");
const AWS = require("aws-sdk");
const moment = require('moment')
const {
    numberToWord
} = require('../helper/numberToWord');

const invoice = async (usersId, requests) => {
    try {
        let userId = usersId;
        let billinTransactionExist = await BillingTransactions.findOne({
            where: {
                BTransactionID: requests.billingTransactionId
            },
            include: [{
                model: Billingcourse,
                as: 'CourseData'
            }]
        })
        if (!billinTransactionExist)
            return { status: false, message: "Course not found", data: {} }
        // return response(res, 422, 'Course not found')
        let user = await User.findOne({
            where: {
                UserID: userId
            }
        })
        if (!user)
            return { status: false, message: "User not found", data: {} }
        // return response(res, 422, 'User not found')

        let billingAddon = await BillingTransactionAddon.findAll({
            where: {
                billing_transaction_id: billinTransactionExist.dataValues.BTransactionID,
                isDefaultCourse: 0,
                student_id: userId,
                status: 1,
                [Op.and]: [{
                    addon_name: {
                        [Op.ne]: null
                    }
                }, {
                    addon_name: {
                        [Op.ne]: ""
                    }
                }]
            }
        })
        // Sample HTML content
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
                    <title>Document</title>
            
                    <style>
                        body {
                            font-family: "Roboto", sans-serif;
                            font-size: 14px;
                            line-height: 1.4;
                        }
                        .page {
                            width: 21cm;
                            background: white;
                            margin: 1cm auto;
                            padding: 20px 15px;
                        }
                        .page_content {
                            border: 1px solid #000;
                        }
                        .page_content .invoice_title {
                            justify-content: space-between;
                            border-bottom: 1px solid;
                            padding: 0 5px;
                        }
            
                        .page_content .invoice_title h2 {
                            margin: 10px 0;
                            width: 100%;
                            max-width: 50%;
                            font-size: 20px;
                        }
            
                        .page_content ul {
                            list-style: none;
                            padding: 0;
                        }
            
                        .page_content {
                            /* padding: 10px; */
                        }
            
                        .titleInvoice_content .left_content ul {
                            display: flex;
                            flex-wrap: wrap;
                            padding: 0;
                        }
            
                        .titleInvoice_content .left_content ul li {
                            width: 63%;
                            padding: 4px 0;
                            border-bottom: 1px solid #000;
                            border-right: 1px solid #000;
                        }
            
                        .titleInvoice_content .left_content ul li:nth-child(even) {
                            width: 35%;
                            border-right: 0;
                            padding-left: 5px;
                        }
                        .titleInvoice_content .left_content ul li b {
                            width: 100px;
                            display: inline-block;
                        }
            
                        .titleInvoice_content .left_content ul li:nth-child(even) b {
                            width: 50px;
                        }
                        .page_content b {
                            display: inline-block;
                        }
                        .invoice_price_description {
                            display: flex;
                            justify-content: space-between;
                            margin: 15px 0;
                            border: 1px solid #000;
                            border-left: 0;
                            border-right: 0;
                        }
            
                        .invoice_price_description .content_left {
                            width: 100%;
                            max-width: 48%;
                            border-right: 1px solid #000;
                        }
            
                        .invoice_price_description .content_right {
                            width: 100%;
                            max-width: 52%;
                        }
            
                        .invoice_price_description .content_left ul li {
                            border-bottom: 1px solid #000;
                            margin: 10px 0;
                            font-weight: bold;
                        }
            
                        .invoice_price_description .content_left ul li b {
                            border-right: 1px solid;
                            margin-right: 5px;
                        }
            
                        .invoice_price_description .content_right ul li {
                            display: flex;
                            justify-content: space-between;
                            border-bottom: 1px solid #000;
                            margin: 10px 0;
                            font-weight: bold;
                        }
            
                        .invoice_price_description .content_right ul li span {
                            width: 50%;
                            text-align: center;
                        }
            
                        .invoice_price_description .content_right ul.bill_description li {
                            font-weight: normal;
                            text-align: left;
                            margin: 0;
                        }
            
                        .invoice_price_description .content_right ul.bill_description li span,
                        .invoice_price_description .content_right ul.bill_description li b {
                            text-align: left;
                            width: 50%;
                            border-right: 1px solid #000;
                        }
            
                        .invoice_price_description .content_right ul.bill_description li span:last-child,
                        .invoice_price_description .content_right ul.bill_description li b:last-child {
                            text-align: right;
                            border-right: 0;
                        }
                        .titleInvoice_content {
                            padding: 0 5px;
                        }
            
                        .invoice_price_description .content_right ul {
                            padding: 0 5px;
                        }
                        .invoice_price_description .content_right ul.bill_description {
                            margin: 0;
                        }
            
                        .table_wrap {
                            padding: 0;
                            margin-top: 35px;
                        }
            
                        .table_wrap table {
                            width: 100%;
                            border-collapse: collapse;
                        }
            
                        .table_wrap table thead {
                            background: #aaaaaa7a;
                        }
            
                        .table_wrap table th,
                        .table_wrap table td {
                            padding: 5px;
                            text-align: left;
                            border: 1px solid #000;
                        }
            
                        .table_wrap table th:first-child,
                        .table_wrap table td:first-child {
                            border-left: 0;
                        }
            
                        .table_wrap table th:last-child,
                        .table_wrap table td:last-child {
                            border-right: 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="page" size="A4">
                        <div class="page_content">
                            <div class="invoice_title" style="display: flex">
                                <h2 style="width: 40%">SHUBHRA VIRAJ EDUTECH PRIVATE LIMITED</h2>
                                <h2 style="text-align: center; width: 60%">RETAIL INVOICE</h2>
                            </div>
                            <div class="titleInvoice_content" style="display: flex; justify-content: space-between; border-bottom: 1px solid #000">
                                <div class="right_content" style="width: 40%; border-right: 1px solid #000; margin-right: 5px">
                                    <ul style="border-bottom: 1px solid #000; padding-bottom: 10px">
                                        <li>SHUBHRA VIRAJ EDUTECH PRIVATE LIMITED,</li>
                                        <li>HOUSE NO 359 SFS FLATS,</li>
                                        <li>DR, MUKHERJEE NAGAR,</li>
                                        <li>DELHI, North West, Delhi, India, 110009</li>
                                        <li>GSTN: 07ABFCS4965B1ZB</li>
                                        <li>PAN: ABFCS4965B</li>
                                        <li>State Name: Delhi (State Code-07)</li>
                                    </ul>
                                    <ul>
                                    <li>Student Details:</li>
                                	<li><span>Name - </span> ${user.FirstName + " " + (user.MiddleName ? user.MiddleName : '') + '' + (user.LastName ? user.LastName : '')}</li>
                                    <li><span>Email - </span> ${user.EmailID ? user.EmailID : ''}</li>
                                    <li><span>Mobile - </span> ${user.Mobile ? user.Mobile : ''}</li>
                                	<li><span>Address - </span>${user.THouseNo ? user.THouseNo : ""}, ${user.TStreet ? user.TStreet : ""}, ${user.TLandmark ? user.TLandmark : ""}, ${user.TCity ? user.TCity : ""}, ${user.TState ? user.TState : ""}, ${user.TZipCode || ""}</li>
                                    </ul>
                                </div>
                                <div class="left_content" style="width: 60%">
                                <ul>
                            	<li><b>Invoice No:</b>${billinTransactionExist.InvoiceNo ? billinTransactionExist.InvoiceNo : ""}</li>
                                <li><b>Dated: </b>${moment(billinTransactionExist.AddedOn).format('Do MMM YYYY')}</li>
                                <li><b>Other Ref. No.:</b></li>
                                <li><b>Dated:</b></li>
                                <li><b>Payment Type: </b>Online</li>
                            	<li><b></b></li>
                                </ul>
                                </div>
                            </div>
            
                            <div class="invoice_price_description">
                                <div class="content_left">
                                    <ul>
                                        <li><b style="width: 40px">S.No.</b>Description of Service</li>
                                        <li><b style="width: 40px">1</b>${billinTransactionExist && billinTransactionExist.CourseData ? billinTransactionExist.CourseData.dataValues.CourseTitle : ""}</li>`;
        if (billingAddon.length) {
            for (let i = 0; i < billingAddon.length; i++) {
                htmlContent += `<li><b style="width: 40px">${i + 2}</b>${billingAddon[i].dataValues.addon_name}</li>`;

            }
        }
        htmlContent += `</ul>
                                </div>
                                <div class="content_right">
                                    <ul>
                                        <li><span>HSN /SAC </span><span>Amount of Services</span></li>
                                        <li><span>999293</span> <span>${billinTransactionExist.BillAmount}</span></li>`;
        if (billingAddon.length) {
            for (let i = 0; i < billingAddon.length; i++) {
                htmlContent += `<li><b style="width: 40px"></b>${billingAddon[i].dataValues.addon_fee}</li>`;

            }
        }
        htmlContent += `</ul>                                   
            
                                    <ul class="bill_description">
                                    <li><b>Taxable Service </b><b>${billinTransactionExist.BillAmount}</b></li>
                                	<li><span>Less : Discount</span><span>${billinTransactionExist.DiscountAmount || 0.00}</span></li>
         							<li><b>Net Taxable Service </b><b>${billinTransactionExist.NetTaxablevalue || 0.00}</b></li>
         							<li><span>CGST ${billinTransactionExist.CourseData.GSTRate == 0 ? 0 : (parseInt(billinTransactionExist.CourseData.GSTRate)/2)}%</span><span>${(billinTransactionExist.CourseData.GSTRate * billinTransactionExist.BillAmount) / 100}</span></li>
         							<li><span>SGST ${billinTransactionExist.CourseData.GSTRate == 0 ? 0 : (parseInt(billinTransactionExist.CourseData.GSTRate)/2)}%</span><span>${(billinTransactionExist.CourseData.GSTRate * billinTransactionExist.BillAmount) / 100}</span></li>
         							<li><span>IGST</span><span>0.00</span></li>
         							<li><span>Rounded Up</span><span>${billinTransactionExist.RoundedUp}</span></li>
         							<li><b>Net Course Fee</b><b>${billinTransactionExist.NetCourseFee}</b></li>
         							<li><span>Convenience Chgs</span><span>0.00</span></li>
         							<li style="border-bottom: 0"><b>Total Amount</b><b>${billinTransactionExist.BillAmount}</b></li>
                                    </ul>
                                </div>
                            </div>
                            <div class="table_wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>HSN/SAC</th>
                                            <th>Description of Service</th>
                                            <th>Taxable Value</th>
                                            <th>CGST ${billinTransactionExist.CourseData.GSTRate == 0 ? 0 : (parseInt(billinTransactionExist.CourseData.GSTRate)/2)}%</th>
                                            <th>SGST ${billinTransactionExist.CourseData.GSTRate == 0 ? 0 : (parseInt(billinTransactionExist.CourseData.GSTRate)/2)}%</th>
                                            <th>Total Tax Amount</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>999293</td>
                                            <td>Course Fee</td>
                                            <td>${billinTransactionExist.NetTaxablevalue}</td>
                                            <td>${billinTransactionExist.CFCGST}</td>
                                            <td>${billinTransactionExist.CFSGST}</td>
                                            <td>${billinTransactionExist.TotalTaxAmount}</td>
                                            <td>${billinTransactionExist.BillAmount}</td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td>Convenience Charges</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                            <td>0.00</td>
                                        </tr>
                                        <tr>
                                            <th></th>
                                            <th>Total</th>
                                            <th>${billinTransactionExist.NetTaxablevalue}</th>
                                            <th>${billinTransactionExist.CFCGST}</th>
                                            <th>${billinTransactionExist.CFSGST}</th>
                                            <th>${billinTransactionExist.TotalTaxAmount}</th>
                                            <th>${billinTransactionExist.BillAmount}</th>
                                        </tr>
                                    </tbody>
                                </table>
                                <p style="margin: 0; padding: 5px 0; border-bottom: 1px solid #000">Amount In Word: <strong> ${await numberToWord(billinTransactionExist.BillAmount)}
                                
                                `;
        htmlContent += `</strong></p>
                                <p style="margin: 0; padding: 5px 0; font-weight: bold;  text-align: center">This is system generated invoice hence does not require any signature</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
            
            
            `;

        // Output file path for the generated PDF
        let pdfName = `invoice/${userId}.pdf`
        const pdfOptions = {
            format: 'A4', // or any other format you prefer

        };

        let file = {
            content: htmlContent
        }

        let pdfBufferData = ''
        await html_to_pdf.generatePdf(file, pdfOptions).then(pdfBuffer => {
            // console.log("PDF Buffer:-", pdfBuffer);
            pdfBufferData = pdfBuffer
        });

        const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY,
            region: process.env.AWS_BUCKET_REGION,
        });

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: pdfName,
            Body: pdfBufferData,
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, function (err, data) {
                if (err) {
                    console.log("error", err);
                    // return { status: false, message: err }
                    return Promise.reject(err);
                }
                dump("success", data)
                // return { status: true, message: data }
                return resolve(data);
            });
        });
    } catch (error) {
        dump({ error })
        return { status: false, message: error.message, data: {} }
    }
};

module.exports = invoice;