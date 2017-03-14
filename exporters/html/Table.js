module.exports = function addTable(node, html) {
	html.push(`<h2>${node.name}</h2>`);
	let table = node.value.tableDocument;
	let cells = table.cells;
	let rows = table.size.rows;
	let columns = table.size.columns;
	let widths = table.columns;
	let tbody = '';

	// calc row/column keys
	let columnKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
	let rowKeys = [];
	for (let i = 0; i < 1000; i++) {
		rowKeys.push(i + 1);
	}

	let cellKeys = {};
	for (let row = 0; row <= rows; row++) {
		for (let column = 0; column < columns; column++) {
			cellKeys[columnKeys[column] + '' + rowKeys[row]] = { row, column };
		}
	}

	// map width
	let mapWidths = [];
	for (let widthInfo of widths) {
		let index = columnKeys.indexOf(widthInfo.column);
		mapWidths[index] = widthInfo.width;
	}
	widths = mapWidths;

	// header - TODO: set width
	tbody += '<tr>';
	for (let column = 0; column < columns; column++) {
		if (mapWidths[column]) {
			tbody += `<th style="width: ${mapWidths[column]}px"></th>`;
		}
		else {
			tbody += '<th></th>';
		}
	}
	tbody += '</tr>';

	// create cell address map
	let map = new Array(columns);
	for (let i = 0; i < rows; i++) {
		map[i] = new Array(rows);
	}

	// map data from address
	for (let column of cells) {
		let xy = cellKeys[column.address];
		map[xy.row][xy.column] = column.value;
	}

	// render data
	for (let row = 0; row < rows; row++) {
		tbody += '<tr>';
		for (let column = 0; column < columns; column++) {
			let cellValue = map[row][column] || '&nbsp;';
			let width;
			if (mapWidths[column]) {
				width = `width: ${mapWidths[column]}px`;
			}
			tbody += `<td style="border: 1px solid #eeeeee; padding: 3px; ${width}">${cellValue}</td>`;
		}
		tbody += '</tr>';
	}

	html.push(`<table style="table-layout:fixed;" cellspacing="0" cellpadding="0">
		<tbody>${tbody}</tbody>
	</table>`);
}