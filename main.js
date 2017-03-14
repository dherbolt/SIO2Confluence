const jetpack = require('fs-jetpack');
const page = require(__dirname + '/page');
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

function runInConfluence() {
	var
		Confluence = require('./lib/Confluence'),
    	confluenceClient;


	let projectSpaceId, pageTitle;

	if (cfg.confluence.targetPageUrl) {
		let parts;

		if ((/display/i).test(cfg.confluence.targetPageUrl)) {
			parts = cfg.confluence.targetPageUrl.match(/\/display\/(\w+)\/(.*[^/])\/?$/);

			if (parts.length === 3) {
				projectSpaceId = parts[1] || '';
				pageTitle = parts[2] || '';
				pageTitle = pageTitle.replace('+', ' ');
			}
		}	
	}

	if (!projectSpaceId || !pageTitle) {
		throw 'Target page URL is not defined in config.json or it is in invalid format.';
	}

	confluenceClient = new Confluence({
		user: cfg.confluence.userName,
		password: cfg.confluence.password,
		baseUrl: cfg.confluence.baseUrl,
		space: projectSpaceId.trim(),
		rootPage: pageTitle
	});


//    confluenceClient.confluence.getContentByPageTitle(confluenceClient.space, pageTitle, (err, data) => {
//        if (err !== null) console.log(err);
//
//		console.log(data.results);
//    });

	confluenceClient.createOrUpdatePage(
    	'dherbolt test', // Page title
    	'<h1>abcddd</h1>' // Content
	);
}

//run();
 runInConfluence();