const jetpack = require('fs-jetpack');

const json = {
	/**
	 * Read a valid JSON file.
	 *
	 * @param {String} path Path to the file
	 * @returns {Object} JSON hash, or {} when file not exists
	 */
	read: function(path) {
		return jetpack.read(path, 'json') || {};
	},

	/**
	 * Write JSON data to a file.
	 *
	 * @param {String} path Path to the file
	 * @param {Object} data Additional data to be added/overwritten in the target JSON
	 * @returns {Object} Data written.
	 */
	write: function (path, data) {
		jetpack.write(path, JSON.stringify(data, null, '\t'));
		return data;
	},

	/**
	 * Read JSON data from the file, then apply newData using Object.assign and write it to the same location.
	 * Note: existing data with the same keys will be overwritten.
	 *
	 * @param {String} path Path to the file
	 * @param {Object} newData Additional data to be added/overwritten in the target JSON
	 * @returns {Object} Data written.
	 */
	update: function (path, newData) {
		let data = Object.assign({}, json.read(path), newData);
		json.write(path, data);
		return data;
	}
};

module.exports = json;