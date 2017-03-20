require('./common.js');

const jetpack = require('fs-jetpack');
const page = require(__dirname + '/data-sources/sio/page');
const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const cfg = JSON.parse(jetpack.read('config.json'));
const path = require('path');
let argv = process.argv.slice(2);

function bootstrap(callback) {
	sendXhr('Bootstrap.bootstrap', {
		branch: "production",
		referral: ""
	}, callback);
}


function run(sourcePageUrl) {

	auth.doLogin(cfg.sio.userName, cfg.sio.password, function () {
		bootstrap(function (args) {
			let { error, response, body } = args;

			if (!body.result.bootstrapData) {
				Logger.log('Login failed!');
				process.exit(1);
			}

			auth.info.tenant = body.result.bootstrapData.tenant;
			auth.info.user = body.result.bootstrapData.user;

			sourcePageUrl = sourcePageUrl || cfg.sio.sourcePageUrl;

			if (sourcePageUrl) {
				pageId = getSioPageIdFromUrl(sourcePageUrl);
			}

			if (!pageId) {
				throw 'Source page url is not defined in config.json';
			}

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

if (argv.length && path.normalize(process.argv[1]) === __filename) {
	run(argv[0]);
}