const Logger = require('./lib/Logger');
global.Logger = new Logger('./logs/log-' + (new Date().toISOString().replace(/T/, '_').replace(/\:/g, '-').replace(/\..+/, '')) + '.txt');