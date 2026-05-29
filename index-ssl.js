const express = require('express');
const app = express();
require('dotenv').config();
const fileUpload = require("express-fileupload");
var http = require('http');
var https = require('https');
const cors = require('cors');
var bodyParser = require('body-parser');
const port = process.env.APP_PORT;
const environment = process.env.NODE_ENV;
const fs = require('fs');
app.use(bodyParser.json());

app.use(express.urlencoded({
    extended: false
}));

app.use(cors())

app.use(fileUpload());

app.use("/storage", express.static("storage"));
app.use("/result", express.static("result"));

app.use(bodyParser.json());

const db = require("./models");

require('./routes/index')(app)
global.__basedir = __dirname;

//swagger implementation start here
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const swaggerURL = environment == "test" ? 'http://3.12.253.202:5254/' : 'http://localhost:1111/';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Reel Estate',
            version: '1.0.0'
        },
        servers: [{
            url: swaggerURL
        }]
    },
    apis: ["./routes/*.js"]
}
const swaggerSpec = swaggerJSDoc(options);
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', function (req, res, next) {
    swaggerDocument.host = req.get('host');
    req.swaggerDoc = swaggerDocument;
    next();
}, swaggerUI.serveFiles(swaggerDocument, options), swaggerUI.setup());
//swagger implementation end here



// db.sequelize.sync({ force: false }).then(function () {
db.sequelize.authenticate().then(function () {
    if ((environment == 'test') || (environment == 'development')) {
        app.listen(port, () => {
            console.log(`Local/Development environment listening on port ${port}`)
        })
    } else if (environment == 'production') {
        /* Certificate */
        var privateKey = fs.readFileSync("./ssl/privkey.pem");
        var certificate = fs.readFileSync("./ssl/fullchain.pem");
        // var ca = fs.readFileSync('gd_bundle-g2-g1.crt');
        var credentials = {
            key: privateKey,
            cert: certificate,
            // ca: ca
        };
        var server = require("https").createServer(credentials, app);

        server.listen(port, () => {
            console.log(`Live environment listening on port ${port}`)
        })
    }

}).catch(err => {
    console.error('Unable to connect to the database:', err);
});
