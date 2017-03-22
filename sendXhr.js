const request = require('request');
const auth = require(__dirname + '/auth');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read('config.json'));

let reqId = 2;

module.exports = function sendXhr(method, params, options = {}) {
	return new Promise(function (resolve, reject) {
		var
			headers = {
				'Content-Type': 'application/json'
			},
			uri,
			callback = options.callback;

		if (method !== 'Session.create') {
			uri = `${cfg.sio.baseUrl}/api/app/`;
			headers['Authorization'] = auth.info.tokenType + ' ' + auth.info.accessToken;
		}
		else {
			uri = `${cfg.sio.baseUrl}/login/api/`;
		}

		uri = uri + 'jsonrpc?method=' + method;

		request({
			uri: options.uri || uri,
			method: 'POST',
			timeout: 10000,
			followRedirect: true,
			followAllRedirects: true,
			maxRedirects: 10,
			jar: true,
			gzip: true,
			headers: Object.assign({}, headers, options.headers),
			json: {
				id: reqId++,
				jsonrpc: "2.0",
				method: method,
				params: params
			}
		}, function (error, response, body) {
			if (error) {
				reject(error);
			}
			else {
				resolve({response, body});
			}
			callback && callback({error, response, body});
		});
	});
};