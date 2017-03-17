require('./common.js');

const jetpack = require('fs-jetpack');
const path = require('path');
const processPage = require(__dirname + '/exporters/html/PageToHtml');
let argv = process.argv.slice(2);

let sourceDir = __dirname + '/download/teambuilding-q4-15-11-2016-17-15--416824739844240238';

if (argv.length && path.normalize(process.argv[1]) === __filename) {
	sourceDir = argv[0];
}

let page = processPage(sourceDir);

const outputPath = path.normalize(sourceDir + '/index.html');
jetpack.write(outputPath, page.html);
Logger.log(`Output: ${outputPath}`);
Logger.log(`Done.`);