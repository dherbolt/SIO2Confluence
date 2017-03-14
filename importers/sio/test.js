const jetpack = require('fs-jetpack');
const path = require('path');

let pageRootPath = path.normalize(__dirname + '/../../download/10k-users-in-kerio-connect--58309038387064065');
let outPath = pageRootPath + '/page-sorted.json';
const pageJson = pageRootPath + '/page.json';

console.log(`> Reading ${pageJson}...`);
let page = JSON.parse(jetpack.read(pageJson));

jetpack.write(outPath, JSON.stringify(page, null, '\t'));