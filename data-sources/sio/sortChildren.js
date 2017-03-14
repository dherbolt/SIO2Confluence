const layoutParser = require(__dirname + '/layoutParser');
const jetpack = require('fs-jetpack');
const columnOrder = JSON.parse(jetpack.read(__dirname + '/../../config.json')).sio.columnOrder;

function sortChildren(page) {
	page.children = sortChildrenInternal(page);
	return page;
}

function sortChildrenInternal(node) {
	let columns = layoutParser(node);
	let children = [];

	for (let columnName of columnOrder) {
		if (columns[columnName]) {
			children = children.concat(columns[columnName]);
		}
	}

	return children;
}

module.exports = sortChildren;