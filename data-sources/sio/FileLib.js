const sanitize = require(APP_ROOT + '/fileUtil').sanitize;
const { getNodeInfo } = require(__dirname + '/node');

module.exports = function downloadFileLib(node) {
	return new Promise(function(resolve, reject) {
		let nodeInfo = Object.assign({}, getNodeInfo(node), {
			todo: 'TODO'
		});
		// TODO - download directories & files -> resolve
		resolve(nodeInfo);
	});
};