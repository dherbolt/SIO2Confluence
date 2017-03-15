const jetpack = require('fs-jetpack');
const path = require('path');
const processPage = require(__dirname + '/exporters/html/PageToHtml');

const sourceDir = __dirname + '/download/daniel-herbolt--4507';

let page = processPage(sourceDir);

const outputPath = path.normalize(sourceDir + '/index.html');
jetpack.write(outputPath, page.html);
console.log(`Output: ${outputPath}`);
console.log(`Done.`);