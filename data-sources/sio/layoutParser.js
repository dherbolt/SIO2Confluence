const jetpack = require('fs-jetpack');
const columnOrder = JSON.parse(jetpack.read(__dirname + '/../../config.json')).sio.columnOrder;

module.exports = function parseColumns(page) {
	let columns = {};
	if (!page.children) {
		return columns;
	}
	for (let child of page.children) {
		let layout = child.layout;
		if (layout && layout.column) {
			columns[layout.column] = columns[layout.column] || [];
			columns[layout.column][layout.position] = child;
		}
	}


	for (let columnName in columns) {
		//console.log('layout column: ' + columnName);
		console.assert(columnOrder.indexOf(columnName) >= 0);
		//let items = columns[columnName];
	}

	return columns;
};