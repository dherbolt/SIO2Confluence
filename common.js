const Logger = require('./lib/Logger');
global.Logger = new Logger('./logs/log-' + (new Date().toISOString().replace(/T/, '_').replace(/\:/g, '-').replace(/\..+/, '')) + '.txt');

global.getSioPageIdFromUrl = function(url) {
	let parts = url.match(/\/page-(\d+)-?.*/i);
	if (parts.length === 2) {
		return parts[1] || null;
	}
}