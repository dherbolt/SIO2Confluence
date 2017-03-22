const sanitize = require(APP_ROOT + '/fileUtil').sanitize;
const { getNodeInfo } = require(__dirname + '/node');
const promisefy = require(APP_ROOT + '/promisefy');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));
const sendXhr = require(APP_ROOT + '/sendXhr');

module.exports = function downloadFileLib(node, customParams) {
	return new Promise(function (resolve, reject) {
		let { dirPath, coeId, sioPage } = customParams;

		console.assert(node.type === 'FileLib');

		let nodeInfo = Object.assign({}, getNodeInfo(node, coeId, dirPath), {
			todo: 'TODO'
		});

		// empty file lib
		if (!node.children || node.children.length === 0) {
			resolve({
				nodeInfo,
				files: []
			});
		}

		let files = [];

		promisefy(node.children, processFile, { files, dirPath, coeId, sioPage }).then(function (args) {
			let children = args.map(function (arg) {
				return arg.nodeInfo;
			});
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
	return new Promise(function (resolve, reject) {
		let nodeInfo = parseFile(fileNode, args);
		if (fileNode === 'FileFolder') {
			processFolder(fileNode, args).then(function () {
				resolve({
					nodeInfo: getNodeInfo(fileNode, coeId, dirPath),
					nodeFiles: files
				});
			});
			return;
		}

		resolve({
			nodeInfo: nodeInfo,
			nodeFiles: files
		});
	});
}

function processFolder(folderNode, args) {
	// xhr:Items.getList
	// pid:"476424095723236572"
	// sort:"[{"property":"type","direction":"ASC"},{"property":"shortName","direction":"ASC"},{"property":"extension","direction":"ASC"},{"property":"id","direction":"ASC"}]"
	//
	// {"result":{"items":[{"layout":{"position":0},"updatedTime":"2017-03-20T11:14:15+0100","dashifiedName":"gitignore","updatedBy":{"emailAddress":"vpurchart@kerio.com","invited":false,"guid":"6f168fe5c4e56c57d7b13a96030d140def3cafbe","fullName":"Vaclav Purchart","id":"146","type":"user"},"role":"Admin","file":{"size":30,"createdBy":{"emailAddress":"vpurchart@kerio.com","invited":false,"guid":"6f168fe5c4e56c57d7b13a96030d140def3cafbe","fullName":"Vaclav Purchart","id":"146","type":"user"},"name":".gitignore","createdTime":"2017-03-20T11:14:15+0100","version":1,"hash":"6dcd5d83a076885fa575f0c35e6f015f82a3da7a","properties":{}},"createdBy":{"emailAddress":"vpurchart@kerio.com","invited":false,"guid":"6f168fe5c4e56c57d7b13a96030d140def3cafbe","fullName":"Vaclav Purchart","id":"146","type":"user"},"name":".gitignore","createdTime":"2017-03-20T11:14:15+0100","id":"476424173032647918","roleSource":"Member","type":"File"}]},"id":0,"jsonrpc":"2.0"}
	console.assert(folderNode.type === 'FileFolder');
	Logger.log('Found folder ' + folderNode.name);

	return new Promise(function (resolve, reject) {
		sendXhr('Items.getList', {
			pid: folderNode.id,
			sort: [{ "property": "type", "direction": "ASC" }, { "property": "shortName", "direction": "ASC" }, { "property": "extension", "direction": "ASC" }, { "property": "id", "direction": "ASC" }]
		}, function (args) {
			let { error, response, body } = args;

			if (body.error) {
				Logger.error(`ERROR: ID: ${folderNode.id} -- ${JSON.stringify(body.error)}`);
				Logger.error('Page cannot be downloaded!');
				return;
			}

			resolve();  // TODO: args
		});
	});
}
