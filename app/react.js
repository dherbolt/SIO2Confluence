const processPage = require(__dirname + '/../exporters/html/PageToHtml');
const tidy = require('htmltidy').tidy;
const path = require('path');

var GridRow = React.createClass({
	getInitialState: function() {
		return {
			selected: false,
			focused: false,
			over: false,
			record: this.props.record
		};
	},

	componentWillMount: function() {
		// this.setState({
		// 	selected: false,
		// 	focused: false,
		// 	over: false,
		// 	record: this.props.record
		// });
	},

	handleEvent: function (e) {
		this.props.handleEvent(this.state.record, this, e);
	},

	render: function() {
		var
			cls = ['gridRow'],
			row = this.state.record;

		if (true === this.state.selected) {
			cls.push('itemSelected');
		}

		if (true === this.state.focused) {
			cls.push('itemFocused');
		}

		if (true === this.state.over) {
			cls.push('itemOver');
		}
		return (

			<div
				className={cls.join(' ')}
				onMouseOver={this.handleEvent}
				onMouseOut={this.handleEvent}
				onMouseDown={this.handleEvent}
				onClick={this.handleEvent}
			>
				<div>
					<span className="name">{row.name}</span>
				</div>
			</div>
		);
	}
});

var Grid = React.createClass({
	getInitialState: function() {
		return {
			data: []
		}
	},

	componentWillMount: function() {
		window.grid = this;

		window.start = new Date();

		grid.setState({data: data.sort()});
	},

	componentDidMount: function() {
		window.end = new Date();
		console.log('time: ' + (window.end - window.start));
	},

	componentDidUpdate: function() {
		window.end = new Date();
		console.log('time: ' + (window.end - window.start));
	},

	render: function() {
		var nodes = this.state.data.map(function(row) {
			return (
				<GridRow
					record={row}
					handleEvent={this.handleEvent.bind(this)}
					key={row.id}
				/>
			);
		}.bind(this));
		return (
			<div className="grid">
				{nodes}
			</div>
		);
	},

	handleEvent: function (record, node, e) {
		var eventType = e.type.toLowerCase();

		switch (eventType) {
			case 'mouseover':
				this.onMouseOver.apply(this, arguments);
				break;

			case 'mouseout':
				this.onMouseOut.apply(this, arguments);
				break;

			case 'mousedown':
				this.onMouseDown.apply(this, arguments);
				break;

			case 'click':
				this.onClick.apply(this, arguments);
				break;
		}
	},

	onMouseOver: function (record, node, e) {
		console.log('onMouseOver');
		// this.nodes.getByKey(record.getId()).setState({
		// 	over: true
		// });
		node.setState({
			over: true
		});
	},

	onMouseOut: function (record, node, e) {
		console.log('onMouseOut');
		node.setState({
			over: false
		});
	},

	onClick: function (record, node, e) {
		console.log(`onClick pageId: ${node.props.record.id}`, node);
		let folder = path.dirname(node.props.record.filename);
		let page = processPage(folder);
		let html = page.html;

		let search = /src=("|')(.*?)("|')/gi;
		let match;

		while (match = search.exec(html)) {
			html = html.replace(match[0], `src="${folder}/${match[2]}"`);
		}

		// node.setState({
		// 	selected: true,
		// 	focused: true
		// });

		let options = {
			bare: true,
			breakBeforeBr: true,
			fixUri: true,
			hideComments: true,
			indent: true,
			'output-xhtml': true,
			'show-body-only': true
		};

		tidy(html, options, (err, parsedHtml) => {
			document.getElementById('content').innerHTML = parsedHtml;
		});
	},

	onMouseDown: function (record, node, e) {
		console.log('onMouseDown');
	},
});

ReactDOM.render(
	<Grid />,
	document.getElementById('navigation')
);

window.btnClick = function() {
	data = data.reverse();
	window.start = new Date();
	grid.setState(data);
}

function formatDate(date) {
	date = new Date(date);
	var day = date.getDay();
	var monthIndex = date.getMonth();
	var year = date.getFullYear();

	return day + '.' + (monthIndex + 1) + '.' + year;
}