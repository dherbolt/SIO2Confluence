const exportFromSio = require('./exportFromSio');
const importToConfluence = require('./importToConfluence');

function run () {
	exportFromSio().then((args) => {
		console.log('Downloaded -- ALL DONE');
		let {rootDir} = args;
		importToConfluence(__dirname + '/' + rootDir, null, () => {
			console.log('DONE - ALL UPLOADED');
		});
	});
}

run();