module.exports = {
	sanitize(fileName) {
		return fileName.replace(/[\?\|&;\$%@"<>\(\)\+,]/g, "");
	}
};