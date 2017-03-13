var request = require('request');
var fs = require('fs');
var accessToken = null;
var refreshToken = null;
var tokenType = null;
var session = null;
var token = null;
var reqId = 1;
var tenant, user;


function sendXhr(method, params, callback) {
	var
		headers = {
			'Content-Type': 'application/json'
		},
		uri;

	if (method !== 'Session.create') {
		uri = 'https://samepage.io/api/app/';
		headers['Authorization'] = tokenType + ' ' + accessToken;
	}
	else {
		uri = 'https://samepage.io/login/api/';
	}

	uri = uri + 'jsonrpc?method=' + method;

	request({
		uri: uri,
		method: 'POST',
		timeout: 10000,
		followRedirect: true,
		followAllRedirects: true,
		maxRedirects: 10,
		jar: true,
		gzip: true,
		headers: headers,
		json: {
			id: reqId++,
			jsonrpc: "2.0",
			method: method,
			params: params
		}
	}, function (error, response, body) {
		callback(error, response, body);
	});
}

function doLogin(userName, password, callback) {
	request({
			uri: "https://samepage.io/login/oauth/token",
			method: 'POST',
			timeout: 10000,
			followRedirect: true,
			followAllRedirects: true,
			maxRedirects: 10,
			jar: true,
			gzip: true,
			form: {
				'grant_type': 'password',
				'device_id': 'web-cbcb4c68e7e2ca8b47bd84d57d3f0f1ebb398ac68832d4c2bba1',
				'device_name': 'Chrome',
				'client_id': '8908213257800763793',
				'username': userName,
				'password': password,
				'scope': 'client'
			}
		}, function (error, response, body) {
			var body = JSON.parse(body);

			accessToken = body.access_token;
			refreshToken = body.refresh_token;
			tokenType = body.token_type;

			sendXhr('Session.create', {accessToken: refreshToken}, callback);
		});
}

function bootstrap(callback) {
	sendXhr('Bootstrap.bootstrap', {
		branch: "production",
		referral: ""
	}, callback);
}

function getPageContent(pageId, callback) {
	sendXhr('Pages.getWithContent', {
		id: pageId,
		tenantId: tenant.publicId
	}, callback);
}


function run() {
	var cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));

	doLogin(cfg.sio.userName, cfg.sio.password, function () {
		bootstrap(function (error, response, body) {
			tenant = body.result.bootstrapData.tenant;
			user = body.result.bootstrapData.user;

			getPageContent('58309038387064065', function (error, response, body) {
				var page = body.result.page;
				console.log(page);
			});
		});
	});
}

run();