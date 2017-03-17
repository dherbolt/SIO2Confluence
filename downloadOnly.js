require('./common.js');

const jetpack = require('fs-jetpack');
const page = require(__dirname + '/data-sources/sio/page');
const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const cfg = JSON.parse(jetpack.read('config.json'));

function bootstrap(callback) {
	sendXhr('Bootstrap.bootstrap', {
		branch: "production",
		referral: ""
	}, callback);
}


function run() {

	auth.doLogin(cfg.sio.userName, cfg.sio.password, function () {
		bootstrap(function (args) {
			let { error, response, body } = args;

			if (!body.result.bootstrapData) {
				Logger.log('Login failed!');
				process.exit(1);
			}

			auth.info.tenant = body.result.bootstrapData.tenant;
			auth.info.user = body.result.bootstrapData.user;

			if (cfg.sio.sourcePageUrl) {
				let parts = cfg.sio.sourcePageUrl.match(/\/page-(\d+?)-.*/i);

				if (parts.length === 2) {
					pageId = parts[1];
				}
			}

			if (!pageId) {
				throw 'Source page url is not defined in config.json';
			}

			pageId = '181462';

			page.getContent(pageId).then((args) => {
				let { error, response, body } = args;
				var page = body.result.page;
				jetpack.write(`download/${pageId}/page.json`, JSON.stringify(page, null, '\t'));
				Logger.log(`Output: download/${pageId}/page.json`);
				Logger.log('Done.');
			});
		});
	});
}

run();
