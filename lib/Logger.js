const jetpack = require('fs-jetpack');

function Logger(fileName) {
	this.fileName = fileName;
};

Logger.prototype.log = function (str) {
	console.log.apply(console, arguments);
	jetpack.append(this.fileName, this._format(arguments));
};

Logger.prototype.getLogFilename = function () {
	return this.fileName;
};

Logger.prototype.error = function (str) {
	console.error.apply(console, arguments);
	jetpack.append(this.fileName, this._format(arguments));
};

Logger.prototype._format = function (args) {
	let out = '';

	for (let arg of args) {
		let type = typeof arg;

		if (type === 'number' || type === 'string') {
			out += arg;
		}
		else if (null === arg) {
			out += 'null';
		}
		else if (undefined === arg)  {
			out += 'undefiend';
		}
		else if (arg instanceof Date) {
			out += arg.toISOString();
		}
		else {
			try {
				out += JSON.stringify(arg);
			}
			catch (e) {
				out += `'${typeof (arg)}'`;
			}
		}
	}

	return out + '\n';
};

module.exports = Logger;