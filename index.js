const express = require("express");
const app = express();
require("dotenv").config();
const fileUpload = require("express-fileupload");
var http = require("http");
var https = require("https");
const cors = require("cors");
var bodyParser = require("body-parser");
const port = process.env.APP_PORT;
const environment = process.env.NODE_ENV;
const fs = require("fs");
app.use(bodyParser.json());
var admin = require("firebase-admin");
var morgan = require("morgan");
var path = require("path");
var rfs = require("rotating-file-stream");
const socket = require("socket.io");
// create a rotating write stream
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});

// setup the logger
app.use(morgan("combined", { stream: accessLogStream }));

app.use(
  express.urlencoded({
    extended: false,
  })
);

// List of allowed origins
const allowedOrigins = [
  'https://www.sahayoghomecare.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://192.168.1.57:5173',
  'https://sahayoghomecare.com',
  'https://admin.sahayoghomecare.com',
  'http://localhost:3000',
  'http://192.168.1.67:3000',
  'http://192.168.1.16:5173',
  'http://192.168.1.47:7009'
];


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl/postman
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

//app.use(cors());
// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like curl or mobile apps)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));

// Handle preflight for all routes
//app.options('*', cors());

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight requests use same config


app.use("/spimages", express.static("spimages"));
app.use("/dispatchexcel", express.static("dispatchexcel"));
app.use("/inductionfiles", express.static("inductionfiles"));
app.use('/uploaddocuments', express.static('uploaddocuments'));
//

app.use(fileUpload());

app.use("/storage", express.static("storage"));
app.use("/result", express.static("result"));
app.use("/invoice", express.static("invoice"));
app.use("/userdocuments", express.static("userdocuments"));
app.use("/uploadDocs", express.static("uploadDocs"));

app.use(bodyParser.json());
if (environment == "production") {
  app.use(morgan("dev"));
}

const db = require("./models");

require("./routes/index")(app);
require("./app/helper/global");
global.__basedir = __dirname;
//swagger implementation start here
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const swaggerURL =
  environment == "test"
    ? "http://3.12.253.202:5254/"
    : "http://localhost:1111/";
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "gd illuminations",
      version: "1.0.0",
    },
    servers: [
      {
        url: swaggerURL,
      },
    ],
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJSDoc(options);
const swaggerDocument = require("./swagger.json");
const { dump } = require("./app/helper/logs");
app.use(
  "/api-docs",
  function (req, res, next) {
    swaggerDocument.host = req.get("host");
    req.swaggerDoc = swaggerDocument;
    next();
  },
  swaggerUI.serveFiles(swaggerDocument, options),
  swaggerUI.setup()
);

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

//swagger implementation end here

// db.sequelize.sync({ force: false }).then(function () {
db.sequelize
  .authenticate()
  .then(function () {
    if (environment == "test" || environment == "production") {
      var server = require("http").createServer(app);
      //socket.io
     
      app.listen(port, () => {
        console.log(`Local/Development environment listening on port ${port}`);
      });
      } else if (environment == "production") {
      
      /* Certificate */
      var privateKey = fs.readFileSync("./ssl/privkey.pem");
      var certificate = fs.readFileSync("./ssl/fullchain.pem");
      // var ca = fs.readFileSync('gd_bundle-g2-g1.crt');
      var credentials = {
        key: privateKey,
        cert: certificate,
        // ca: ca
      };
      //var server = require("https").createServer(credentials, app);
      var server = https.createServer(credentials, app);
      
      
        server.listen(port, () => {
        console.log(`Live environment listening on port ${port}`);
      });
    }
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

