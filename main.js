// npm run start https://samepage.io/app/#!/72f3728084841d1a9db65c44335a41d27bfa96c2/page-461349596690568953-409a-jul-2008-and-jul-2010 mosladil
// npm run start <sourcePageUrl> <targetPageName>

const exportFromSio = require('./exportFromSio').exportFromSio;
const importToConfluence = require('./importToConfluence').importToConfluence;
const argv = process.argv.slice(2);

function run (sourcePageUrl, targetPageName) {

	exportFromSio(sourcePageUrl).then((args) => {
		console.log('Downloaded -- ALL DONE');
		let {rootDir} = args;
		importToConfluence(__dirname + '/' + rootDir, targetPageName, () => {
			console.log('DONE - ALL UPLOADED');
		});
	});
}

run(argv[0] || null, argv[1] || null);