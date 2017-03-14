const request = require('request');
const auth = require(__dirname + '/auth');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read('config.json'));

let reqId = 2;

module.exports = function sendXhr(method, params, callback) {
	var
		headers = {
			'Content-Type': 'application/json'
		},
		uri;

	if (method !== 'Session.create') {
		uri = `${cfg.sio.baseUrl}/api/app/`;
		headers['Authorization'] = auth.info.tokenType + ' ' + auth.info.accessToken;
	}
	else {
		uri = `${cfg.sio.baseUrl}/login/api/`;
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
		callback({error, response, body});
	});
};