const { sanitize, sanitizeName } = require(APP_ROOT + '/fileUtil');
const jetpack = require('fs-jetpack');
const cfg = JSON.parse(jetpack.read(APP_ROOT + '/config.json'));
const json = require(APP_ROOT + '/json');

module.exports = {
	getNodeInfo: getNodeInfo
};

function getNodeInfo(node, coeId, dirPath) {
	let nodeInfo = {
		type: node.type,
		name: sanitizeName(node.name),
		id: node.id,
		dashifiedName: node.dashifiedName,
		layout: node.layout,
		value: node.value && (node.value.text || node.value.url),
		file: parseFile(node, coeId, dirPath)
	};

	switch (node.type) {
		case 'File':
			nodeInfo.value = nodeInfo.file;
			break;
		case 'Map':
			nodeInfo.value = node.value.markerPosition;
			break;
		case 'Mashup':
			nodeInfo.value = node.value.html;
			break;
		case 'Event':
			nodeInfo.value = {
				allday: node.value.allday,
				endDate: node.value.endDate,
				startDate: node.value.startDate,
				description: node.value.description,
				location: node.value.location
			};
			break;
		case 'Task':
			nodeInfo.value = node.value;
			break;
		case 'TaskList':
			nodeInfo.children = node.tasks.map((task) => {
				return getNodeInfo(task, coeId, dirPath);
			});
			break;
		default:
	}

	return nodeInfo;
}



function parseFile(node, coeId, dirPath) {
	if (!node.file) {
		return;
	}
	let file = node.file;
	let name = sanitize(file.name);
	addFile(coeId, node.id, `${dirPath}/${name}`);
	return {
		name: name,
		dashifiedName: node.dashifiedName,
		properties: file.properties
	};
}


function addFile(coeId, id, outFilePath) {
	let fileInfo = {
		url: `${cfg.sio.baseUrl}/${coeId}/file/${id}`,
		path: outFilePath,
		id: id
	};
	// json.update(global.dbFilesToDownload, { [id]: fileInfo });
	global.files.push(fileInfo);
}
