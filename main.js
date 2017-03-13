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
			auth.info.tenant = body.result.bootstrapData.tenant;
			auth.info.user = body.result.bootstrapData.user;
			// let pageId = '227087075764359201';
			let pageId = '227087075764359201';

			page.getContent(pageId).then((args) => {
				let {error, response, body } = args;
				var page = body.result.page;
				jetpack.write(`download/${pageId}/page.json`, JSON.stringify(page, null, '\t'));
				console.log('done');
			});

			page.download(pageId).then(() => {
				console.log('downloaded');
			});
		});
	});
}

function runInConfluence() {
	var
		Confluence = require('./lib/Confluence'),
    	confluenceClient = new Confluence({
        	user: cfg.confluence.userName,
	        password: cfg.confluence.password,
    	    baseUrl: cfg.confluence.baseUrl
    	});

	confluenceClient.createOrUpdatePage(
    	'KERCON', // Project space
    	'mosladil', // Page title
    	'<h1>Tralala</h1>' // Content
	);
}

run();
// runInConfluence();