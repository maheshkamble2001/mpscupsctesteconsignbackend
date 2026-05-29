let User = require('../../models').tbl_webusers;
const jwt = require("jsonwebtoken");
const { decrypter } = require('./crypto');
const { dump } = require('./logs');

const user = async (req) => {
	if (process.env.ENCRYPTION == 'false') {
		var token = (req.headers.authorization ? req.headers.authorization.split(" ")[1] : "") || (req.body && req.body.access_token) || req.body.token || req.query.token || req.query.access_token || req.headers["x-access-token"];
	} else {
		let decryptedData = await decrypter(req.query.reqData || req.body.reqData);
		// dump("decryptedData1", decryptedData);
		if (decryptedData == false) {
			decryptedData = await decrypter(req.query || req.body);
		}
		// dump("decryptedData2", decryptedData);
		var token = decryptedData.access_token;
	}

	if (token) {
		var decoded;
		decoded = jwt.verify(token, process.env.JWT_SECRET);

		var userId = decoded.UserID;

		var user = await User.findOne({
			where: {
				UserID: userId
			}
		});
		return user;
	} else {
		return false;
	}
};

module.exports = user;