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

			// page.getContent(pageId).then((args) => {
			// 	let { error, response, body } = args;
			// 	var page = body.result.page;
			// 	jetpack.write(`download/${pageId}/page.json`, JSON.stringify(page, null, '\t'));
			// 	console.log('done');
			// });

			page.download(pageId).then((args) => {
				console.log('downloaded -- ALL DONE');
			});
		});
	});
}

run();
