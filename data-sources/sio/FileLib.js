const sanitize = require(APP_ROOT + '/fileUtil').sanitize;
const { getNodeInfo } = require(__dirname + '/node');
const promisefy = require(APP_ROOT + '/promisefy');


module.exports = function downloadFileLib(node) {
	return new Promise(function(resolve, reject) {
		let nodeInfo = Object.assign({}, getNodeInfo(node), {
			todo: 'TODO'
		});

		promisefy(node.children, processFile).then(function(children) {
			nodeInfo.children = children;
			resolve(nodeInfo);
		});
	});
};


function processFile(fileNode) {
	// TODO - download directories & files -> resolve
	return new Promise(function (resolve, reject) {
		resolve(getNodeInfo(fileNode));
	});
}
