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
		page.name,
		'',
		null, // start in root page defined in cfg
		function (result) {
			for (let fileName of page.attachments) {
				page.html = page.html.replace(fileName, getFileLink(result.id, fileName));
				console.log('Upload attachment: ' + fileName);
				client.uploadOrUpdateFile(page.name, fileName, `download/${sourceDir}/${fileName}`, function (attachment) {});
			}

			let pages = [];
			let doneCallback;
			let done = new Promise(function(resolve, reject) {
				doneCallback = resolve;
			});

			const precessNexPage = function (index) {
				let subPage = page.subPages[index];

				if (!subPage) {
					doneCallback();
					return;
				}

				console.log(subPage.name + '/' + index);

				let promise = client.getPageIdByTitle(subPage.name);

				promise.then((id) => {
					// ok - get id
					pageMap[subPage.id] = id;
					pages.push(Promise.resolve(id));
					precessNexPage(index + 1);
				})
				.catch(() => {
					// create
					pages.push(client.createPage(subPage.name, '', result.id, function(result) {
						pageMap[subPage.id] = result.id;
						precessNexPage(index + 1);
					}));
				});
			};

			precessNexPage(0);

			done.then(() => {

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