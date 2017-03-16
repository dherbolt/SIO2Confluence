const jetpack = require('fs-jetpack');
const path = require('path');
const processPage = require(__dirname + '/exporters/html/PageToHtml');
let argv = process.argv.slice(2);

let sourceDir = __dirname + '/download/daniel-herbolt--4507';

if (argv.length && path.normalize(process.argv[1]) === __filename) {
	sourceDir = argv[0];
}
else {
	throw new Error('You must specify page root directory!');
}

let page = processPage(sourceDir);

const outputPath = path.normalize(sourceDir + '/index.html');
jetpack.write(outputPath, page.html);
console.log(`Output: ${outputPath}`);
console.log(`Done.`);