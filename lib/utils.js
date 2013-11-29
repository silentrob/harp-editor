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

// Same normaizeFilePart, but keys file extension in tact.
exports.normaizeFilePartExt = function(filePart) {
	var parts, tail, ext;
	if (!filePart) return "";

	parts = filePart.split(nodePath.sep);
	tail = parts.pop();
  return tail;
}

// For creating files in sub folders, we need to reduce the path
// Tests
// console.log(editor.utils.reduceFilePart(undefined)); 		= "/"
// console.log(editor.utils.reduceFilePart("")); 						= "/"
// console.log(editor.utils.reduceFilePart("foo")); 				= "/"
// console.log(editor.utils.reduceFilePart("foo.md"));			= "/"
// console.log(editor.utils.reduceFilePart("/foo"));				= "/"
// console.log(editor.utils.reduceFilePart("/foo.me"));			= "/"
// console.log(editor.utils.reduceFilePart("/foo/bar.md"));	= "/foo/"
// console.log(editor.utils.reduceFilePart("/foo/baz/md")); = "/foo/baz/"

exports.reduceFilePart = function(filePart) {
	var parts, tail, ext;
	if (!filePart) return nodePath.sep;

	parts = filePart.split(nodePath.sep);
	if (parts.length <= 2) {
		return nodePath.sep
	} else {
		parts.pop();	
		return parts.join(nodePath.sep) + nodePath.sep;
	}
}


exports.getExtension = getExtension = function(filename) {
	var ext = nodePath.extname(filename||'').split('.');
	return ext[ext.length - 1];
}
