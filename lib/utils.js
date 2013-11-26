var _ = require("underscore");

exports.filterEditableSync = function(fileArray) {
	var i, filteredFiles = [], types = ["html", "md", "jade"], ntypes = ["css", "js", "images", "img", ".git"];
	for(i = 0; i < fileArray.length; i++) {
		if (_.contains(types, getExtension(fileArray[i]))) {
			filteredFiles.push(fileArray[i]);
		}
	}

	// Second Pass
	return _.filter(filteredFiles, function(item) {
		return !_.some(_.map(ntypes, function(r){
			return (item.indexOf(r) !== -1)
		}));
	})
}