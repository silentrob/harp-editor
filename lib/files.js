var nodePath 		= require('path');
var fs 					= require('fs');
var walk    		= require('walk');
var _ 					= require('underscore');

module.exports = function(cfg) {
	
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

