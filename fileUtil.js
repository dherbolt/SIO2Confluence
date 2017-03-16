module.exports = {
	sanitizeFileName(fileName) {
		return fileName.replace(/[\?\|&;\$%@"<>\(\)\+,]/g, "");
	}
};