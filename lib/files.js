var nodePath 		= require('path');
var fs 					= require('fs');
var walk    		= require('walk');
var _ 					= require('underscore');

module.exports = function(cfg) {
	return {
		fetch : function(callback) {
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

	}
}

