var request = require('request');
var accessToken = null;
var refreshToken = null;
var session = null;
var token = null;
var reqId = 1;

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
			'username': 'dherbolt@kerio.com',
			'password': 'aaa123',
			'scope': 'client'
		}
	}, function(error, response, body) {
		accessToken = JSON.parse(body).access_token;
		refreshToken = JSON.parse(body).refresh_token;

		request({
			uri: "https://samepage.io/login/api/jsonrpc?method=Session.create",
			method: 'POST',
			timeout: 10000,
			followRedirect: true,
			followAllRedirects: true,
			maxRedirects: 10,
			jar: true,
			gzip: true,
			headers: {
				'Content-Type': 'application/json'
			},
			json: {
				id: reqId++,
				jsonrpc: "2.0",
				method: "Session.create",
				params: {accessToken: refreshToken}
			}
		}, function (error, response, body) {
			var result = body.result;

			token = result.token;
			session = result.session;

			console.log(token + '/' + session);
		});
	});

