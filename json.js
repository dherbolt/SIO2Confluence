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

// --------------------------------------------------------------------------------------
//                                         <TESTS>
// --------------------------------------------------------------------------------------

const testDir = 'logs/tests';
let result, file;
const assert = require('assert').strictEqual;

// - read
result = json.read(file = `${testDir}/non-existing.json`);
assert('{}', JSON.stringify(result));


// - write
let dataA, dataB;
dataA = {'a': 1};
result = json.write(file = `${testDir}/json-write-test.json`, dataA);
assert('{"a":1}', JSON.stringify(result));
result = json.read(file);
assert('{"a":1}', JSON.stringify(result));

dataB = {'b': 2};
result = json.write(file = `${testDir}/write-test.json`, dataB);
assert('{"b":2}', JSON.stringify(result));
result = json.read(file);
assert('{"b":2}', JSON.stringify(result));


// - update
result = json.write(file = `${testDir}/update-test.json`, dataA);
result = json.update(file, dataB);
assert('{"a":1,"b":2}', JSON.stringify(result));
result = json.read(file);
assert('{"a":1,"b":2}', JSON.stringify(result));


// - delete items by update
result = json.write(file = `${testDir}/delete-test.json`, Object.assign({}, dataA, dataB));
assert('{"a":1,"b":2}', JSON.stringify(result));
result = json.update(file, {b: undefined});
assert('{"a":1}', JSON.stringify(result));
result = json.read(file);
assert('{"a":1}', JSON.stringify(result));




// --------------------------------------------------------------------------------------
//                                         </TESTS>
// --------------------------------------------------------------------------------------
