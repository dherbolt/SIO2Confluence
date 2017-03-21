const jetpack = require('fs-jetpack');
const columnOrder = JSON.parse(jetpack.read(__dirname + '/../../config.json')).sio.columnOrder;

module.exports = function parseColumns(page) {
	let columns = {};
	if (!page.children) {
		return columns;
	}

	fixLayoutDef(page.children);

	for (let child of page.children) {
		let layout = child.layout;

		if (layout && layout.column) {
			columns[layout.column] = columns[layout.column] || [];
			columns[layout.column][layout.position] = child;
		}
	}


	for (let columnName in columns) {
		//Logger.log('layout column: ' + columnName);
		console.assert(columnOrder.indexOf(columnName) >= 0);
		//let items = columns[columnName];
	}

	return columns;
};

function fixLayoutDef(children) {
	let 
		maxPos = 0,
		missingLayoutPos = [];

	for (let child of children) {
		let layout = child.layout;

		if (!layout) {
			continue;
		}

		let position = parseInt(layout.position, 10);
		if (!isNaN(position) && position > maxPos) {
			maxPos = position;
		}

		if (!layout.hasOwnProperty('position')) {
			missingLayoutPos.push(layout);
		}

		if (!layout.hasOwnProperty('column')) {
			layout.column = 'center';
		}
	}

	for (let layout of missingLayoutPos) {
		layout.position = ++maxPos;
	}
}