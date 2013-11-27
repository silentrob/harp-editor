var _ 					= require('underscore');
var nodePath 		= require('path');
var nodeSlug		= require('slug');

exports.slug = function(slug) {
	return nodeSlug(slug).toLowerCase();
}

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

// clean up the filepart and return a clean key for _data.json
// /foo/bar.md => bar
// /foo.md => foo
// foo.md => foo
exports.normaizeFilePart = function(filePart) {
	var parts, tail, ext;
	if (!filePart) return "";

	parts = filePart.split(nodePath.sep);
	tail = parts.pop();
	ext = getExtension(tail);
  return tail.replace("." + ext, "");
}


exports.getExtension = getExtension = function(filename) {
	var ext = nodePath.extname(filename||'').split('.');
	return ext[ext.length - 1];
}
