const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');


module.exports = {
	download(pageId) {
		return new Promise(function (resolve, reject) {
			resolve();
		});
	},

	getContent(pageId, callback) {
		return new Promise(function (resolve, reject) {
			sendXhr('Pages.getWithContent', {
				id: pageId,
				tenantId: auth.info.tenant.publicId
			}, resolve);
		});
	}
};
