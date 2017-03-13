const request = require('request');


let info = {
	accessToken: null,
	refreshToken: null,
	tokenType: null,
	session: null,
	token: null,
	reqId: 1,
	tenant: undefined,
	user: undefined,
};


// redefine to avoid cyclic dependencies
function sendXhr(method, params, callback) {
	var
		headers = {
			'Content-Type': 'application/json'
		},
		uri;

	if (method !== 'Session.create') {
		uri = 'https://samepage.io/api/app/';
		headers['Authorization'] = info.tokenType + ' ' + info.accessToken;
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
			id: 1,
			jsonrpc: "2.0",
			method: method,
			params: params
		}
	}, function (error, response, body) {
		callback(error, response, body);
	});
}

module.exports.info = info;

module.exports.doLogin = function(userName, password, callback) {
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
		body = JSON.parse(body);

		info.accessToken = body.access_token;
		info.refreshToken = body.refresh_token;
		info.tokenType = body.token_type;

		sendXhr('Session.create', { accessToken: info.refreshToken }, callback);
	});
};