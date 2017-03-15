const Confluence = require('./lib/Confluence');
const jetpack = require('fs-jetpack');
const tidy = require('htmltidy').tidy;
const cfg = JSON.parse(jetpack.read('config.json'));
const processPage = require('./exporters/html/PageToHtml');

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

	//let sourceDir = __dirname + '/download/10k-users-in-kerio-connect--58309038387064065';
	let sourceDir = __dirname + '/download/daniel-herbolt--4507';

	let page = processPage(sourceDir);

	jetpack.write('out.txt', JSON.stringify(page, null, '\t'));

	const getFileLink = function (pageId, fileName) {
		return '/download/attachments/' + pageId + '/' + encodeURI(fileName);
	};

	const getConfluenceSubPageUrl = function(confluenceId) {
		return '/pages/viewpage.action?pageId=' + confluenceId;
	};

	// sio-id => confuluence-id
	let pageMap = {};


	client.createOrUpdatePage(
		page.title,
		'',
		null, // start in root page defined in cfg
		function (result) {
			for (let fileName of page.attachments) {
				page.html = page.html.replace(fileName, getFileLink(result.id, fileName));
				console.log('Upload attachment: ' + fileName);
				client.uploadOrUpdateFile(page.title, fileName, `download/${sourceDir}/${fileName}`, function (attachment) {});
			}

			let pages = [];
			for (let subPage of page.subPages) {
				let promise = client.getPageIdByTitle(subPage.name);

				promise.then((id) => {
					// ok - get id
					pageMap[subPage.id] = id;
					pages.push(new Promise(function (resolve, reject) {
						resolve(id);
					}));
				})
				.catch(() => {
					// create
					pages.push(client.createPage(subPage.name, '', result.id, function(result) {
						pageMap[subPage.id] = result.id;
					}));
				});
			}

			Promise.all(pages).then(() => {

				for (let sioId in pageMap) {
					let confluenceId = pageMap[sioId];

					page.html = page.html.replace(sioId, getConfluenceSubPageUrl(confluenceId));
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
				tidy(page.html, options, function (err, parsedHtml) {
					client.updatePage(
						result.id,
						parseInt(result.version.number, 10) + 1,
						result.title,
						parsedHtml,
						function (result) {
							console.log('Done upload');
						}
					);
				});

			});
		}
	);
}

run();