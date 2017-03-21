global.APP_ROOT = __dirname;

const Logger = require('./lib/Logger');
global.Logger = new Logger('./logs/log-' + (new Date().toISOString().replace(/T/, '_').replace(/\:/g, '-').replace(/\..+/, '')) + '.txt');

global.getSioPageIdFromUrl = function(url) {
	let parts = url.match(/\/#?page-(\d+)-?.*/i);
	if (parts && parts.length === 2) {
		return parts[1] || null;
	}

	return null;
};

// Test
console.assert('123' === getSioPageIdFromUrl('https://samepage.io/abcd1234/#page-123'), 'Page ID regex test');
console.assert('456' === getSioPageIdFromUrl('https://samepage.io/abcd1234/#page-456-neco'), 'Page ID regex test');
console.assert('789' === getSioPageIdFromUrl('https://samepage.io/abcd1234/#page-789-neco-neco'), 'Page ID regex test');
console.assert('123' === getSioPageIdFromUrl('https://samepage.io/app/#!/abcd1234/page-123'), 'Page ID regex test');
console.assert('456' === getSioPageIdFromUrl('https://samepage.io/app/#!/abcd1234/page-456-neco'), 'Page ID regex test');
console.assert('789' === getSioPageIdFromUrl('https://samepage.io/app/#!/abcd1234/page-789-neco-neco'), 'Page ID regex test');
console.assert('123' === getSioPageIdFromUrl('https://samepage.io/app/#page-123'), 'Page ID regex test');
console.assert('456' === getSioPageIdFromUrl('https://samepage.io/app/#page-456-neco'), 'Page ID regex test');
console.assert('789' === getSioPageIdFromUrl('https://samepage.io/app/#page-789-neco-neco'), 'Page ID regex test');

// for readable callstacks during Promise rejections
global.Promise = require('bluebird');