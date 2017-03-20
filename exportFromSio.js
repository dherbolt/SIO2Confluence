require('./common.js');

const jetpack = require('fs-jetpack');
const page = require(__dirname + '/data-sources/sio/page');
const sendXhr = require(__dirname + '/sendXhr');
const auth = require(__dirname + '/auth');
const cfg = JSON.parse(jetpack.read('config.json'));
const path = require('path');
let argv = process.argv.slice(2);

function bootstrap(callback) {
	return sendXhr('Bootstrap.bootstrap', {
		branch: "production",
		referral: ""
	}, callback);
}

function run(sourcePageUrl) {
	return auth.doLogin(cfg.sio.userName, cfg.sio.password)
		.then(function (res) {return bootstrap();})
		.then(function (args) {
			let { response, body } = args;

			if (!body.result.bootstrapData) {
				Logger.log('Login failed!');
				process.exit(1);
			}

			auth.info.tenant = body.result.bootstrapData.tenant;
			auth.info.user = body.result.bootstrapData.user;

			let pageId;
			sourcePageUrl = sourcePageUrl || cfg.sio.sourcePageUrl;

			if (sourcePageUrl) {
				pageId = getSioPageIdFromUrl(sourcePageUrl);
			}

			if (!pageId) {
				Logger.error('Source page url is not defined in config.json');
				throw 'Source page url is not defined in config.json';
			}

			return page.download(pageId);
		}).catch(function (err) {
			Logger.log('ERROR: ', err);
		});
}

module.exports.exportFromSio = run;

if (argv.length && path.normalize(process.argv[1]) === __filename) {
	run(argv[0]);
}