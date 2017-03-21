const sanitize = require(APP_ROOT + '/fileUtil').sanitize;
const { getNodeInfo } = require(__dirname + '/node');
const promisefy = require(APP_ROOT + '/promisefy');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));

module.exports = function downloadFileLib(node, customParams) {
	return new Promise(function (resolve, reject) {
		let { dirPath, coeId, sioPage } = customParams;

		let files = [];
		let nodeInfo = Object.assign({}, getNodeInfo(node), {
			todo: 'TODO'
		});

		promisefy(node.children, processFile, { files, dirPath, coeId, sioPage }).then(function (args) {
			let children = args.map(function(arg) {
				return arg.nodeInfo;
			})
			nodeInfo.children = children;
			resolve({ nodeInfo, files });
		});
	});
};


function parseFile(node, args) {
	let { coeId, dirPath, files, sioPage } = args;
	if (!node.file) {
		return;
	}
	addFile(coeId, node.id, `${dirPath}/${sanitize(node.file.name)}`, args);
	let file = node.file;
	return {
		name: sanitize(file.name),
		dashifiedName: node.dashifiedName,
		properties: file.properties
	};
}


function addFile(coeId, id, outFilePath, args) {
	let { files, sioPage } = args;
	files.push({
		url: `${cfg.sio.baseUrl}/${coeId}/file/${id}`,
		path: outFilePath
	});
}


function processFile(fileNode, args) {
	let { files, dirPath, coeId, baseUrl } = args;
	if (fileNode === 'FileFolder') {
		return processFolder(fileNode, args);
	}

	let nodeInfo = parseFile(fileNode, args);

	return Promise.resolve({
		nodeInfo: nodeInfo,
		nodeFiles: files
	});
}

function processFolder(dirNode, args) {

}
