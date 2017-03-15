const jetpack = require('fs-jetpack');
const page = require(__dirname + '/data-sources/sio/page');
const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const cfg = JSON.parse(jetpack.read('config.json'));

function bootstrap(callback) {
	return sendXhr('Bootstrap.bootstrap', {
		branch: "production",
		referral: ""
	}, callback);
}

module.exports = function run() {
	return auth.doLogin(cfg.sio.userName, cfg.sio.password)
		.then(function (res) {return bootstrap();})
		.then(function (args) {
			let { response, body } = args;

			if (!body.result.bootstrapData) {
				console.log('Login failed!');
				process.exit(1);
			}

			auth.info.tenant = body.result.bootstrapData.tenant;
			auth.info.user = body.result.bootstrapData.user;
			let pageId;
			// let pageId = '227087075764359201';  // desktop app root
			// let pageId = '471215215221119932';  // table test
			if (cfg.sio.sourcePageUrl) {
				let parts = cfg.sio.sourcePageUrl.match(/\/page-(\d+?)-.*/i);

				if (parts.length === 2) {
					pageId = parts[1];
				}
			}

			if (!pageId) {
				throw 'Source page url is not defined in config.json';
			}

			return page.download(pageId);
		});
};