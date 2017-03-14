const Confluence = require('./lib/Confluence');
const jetpack = require('fs-jetpack');
const tidy = require('htmltidy').tidy;
const cfg = JSON.parse(jetpack.read('config.json'));

function run() {
	if (!cfg.confluence.targetSpace || !cfg.confluence.targetPage) {
		throw 'Confluence space and/or page URL is not defined in config.json or it is in invalid format.';
	}

	let client = new Confluence({
		user: cfg.confluence.userName,
		password: cfg.confluence.password,
		baseUrl: cfg.confluence.baseUrl,
		space: cfg.confluence.targetSpace,
		rootPage: cfg.confluence.targetPage
	});

	let sourceDir = '10k-users-in-kerio-connect--58309038387064065';
	let page = JSON.parse(jetpack.read(`download/${sourceDir}/page.json`));

	let content = {
		textNote: ''
	};

	for (let component of page.children) {
		// console.log(`Found ${component.type} => ${component.name}`);
		switch (component.type) {
			case 'TextNote':
				if (component.value) {
					content.textNote += component.value;
				}
				break;
			default:
		}
	}

	let options = {
		bare: true,
		breakBeforeBr: true,
  		fixUri: true,
		hideComments: true,
		indent: true,
		'output-xhtml': true,
		'show-body-only': true
	};

	// Parse and fix HTML
	tidy(content.textNote, options, function (err, parsedHtml) {
		// Post it
		client.createOrUpdatePage(
			page.name,
			parsedHtml,
			null, // start in root page defined in cfg
			function (result) {
				console.log('Callback - ' + result.id);
				// use id to add new subpage
			}
		);
	});
}

run();