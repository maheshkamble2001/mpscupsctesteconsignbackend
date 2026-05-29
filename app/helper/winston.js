const winston = require("winston");
module.exports.logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      level: "error",
      filename: "log/filelog-error.log",
      json: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    //info log file
    // new winston.transports.File({
    //   level: "info",
    //   filename: "log/filelog-info.log", // Change the filename
    //   json: true,
    //   format: winston.format.combine(
    //     winston.format.timestamp(),
    //     winston.format.json()
    //   ),
    // }),
  ],
});