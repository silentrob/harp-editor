var nodePath 		= require('path');
var fs 					= require('fs');
var walk    		= require('walk');
var _ 					= require('underscore');
var nodeSlug		= require('slug');

module.exports = function(cfg) {
	
	// Writes out a file to disk given a slug.
	// Okay, we have slugs, keys, and fileparts, this works with both slugs and fileparts
	// Clearly we have added more args then is idea.. Refactor maybe?
	var writeFileBySlug = function(slug, base, ext, contents, callback) {
		var projectPath = cfg.appPublic, filePart, filePath;
		
		// TODO - Test to see if there is already a extension before calling slug
		slug = nodeSlug(slug);

		filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
		// Make the filePart local / relative, so it will resove to base
		filePart = "." + filePart + "." + ext;
		filePath = nodePath.resolve(base, filePart);
		fetch(function(files){
			// slugs may or may not have an extension.
			// if we dont have one, we need to refer to the table.
			if(_.contains(files, slug)) {
				fs.writeFile(nodePath.resolve(projectPath + filePath), contents, function(err, contentsc){
					if (err) console.log(err);
					callback(contents);
				});
			} else {
				fs.writeFile(nodePath.resolve(projectPath + filePath), contents, function(err, contentsc){
					if (err) console.log(err);
					callback(contents);
				});
			}
		});
	}

	var removeFileBySlug = function(slug, base, ext, callback) {
		var projectPath = cfg.appPublic, filePart, filePath;
		slug = nodeSlug(slug);
		filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
		
		filePart = "." + filePart + "." + ext;
		filePath = nodePath.resolve(base, filePart);
		fetch(function(files){
			if(_.contains(files, filePath)) {
				fs.unlink(nodePath.resolve(projectPath + filePath), function(err){
					if (err) console.log(err);
					callback(err, null);
				});
			} else {
				callback(null, null);
			}
		});
	}

	var fetch = function(callback) {
		var files = [],  walker, path;
		path = cfg.appPublic || cfg;

		walker = walk.walk(path, { followLinks: false });
		walker.on("names", function (root, nodeNamesArray) {
			// Remove hidden files
			for (var i = 0; i < nodeNamesArray.length; i++) {
				if (nodeNamesArray[i][0] === '.') {
					nodeNamesArray.splice(i,1);
				}
			}
		});

		walker.on('file', function(root, stat, next) {
			var fullPath = nodePath.resolve(root, stat.name);
	    files.push(fullPath.replace(path, ""));
	    next();
		});

		walker.on('end', function() {
			callback(files);
		});
	}

	return {
		fetch : fetch,
		writeFileBySlug: writeFileBySlug,
		removeFileBySlug: removeFileBySlug,

		// Same as below but works with full RELATIVE path to file
		fetchFileByPath: function(path, callback) {
			var projectPath = cfg.appPublic, filePart;

			filePart = (path[0] == nodePath.sep) ? path : nodePath.sep + path;
			fetch(function(files){
				if(_.contains(files, filePart)) {
					fs.readFile(nodePath.resolve(projectPath + filePart), 'utf8', function(err, contents){
						callback(contents);
					});
				} else {
					callback("");
				}
			});
		}

	}
}

