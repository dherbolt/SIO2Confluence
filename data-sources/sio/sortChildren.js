const layoutParser = require(__dirname + '/layoutParser');
const jetpack = require('fs-jetpack');
const columnOrder = JSON.parse(jetpack.read(__dirname + '/../../config.json')).sio.columnOrder;

function sortChildren(page) {
	if (page.isNewSio) {
		return page;
	}

	page.children = sortChildrenInternal(page);
	return page;
}

function sortChildrenInternal(node) {
	let columns = layoutParser(node);
	let children = [];
	let colChildren;

	for (let columnName of columnOrder) {
		colChildren = columns[columnName];
		if (colChildren) {
			colChildren = cleanArray(colChildren);  // remove undefined values (fixed sio layout)
			children = children.concat(colChildren);
		}
	}

	return children;
}

function cleanArray(actual) {
	var i, newArray = new Array();
	for (i = 0; i < actual.length; i++) {
		if (actual[i]) {
			newArray.push(actual[i]);
		}
	}
	return newArray;
}


module.exports = sortChildren;