var nodePath 		= require('path');
var fs 					= require("fs");
var walk    		= require('walk');
var _ 					= require("underscore");
var utils 			= require("./utils");

// Fetch Layouts Grouped by folder
// Walk is a bit of a bitch, dont fuck with the nodeNamesArray reference
exports.fetchLayouts = function(cfg, callback) {
	var files = [], hiddenFiles = [], walker, path;
	
	path = cfg.appPublic;
	walker = walk.walk(path, { followLinks: false});
	
	walker.on("names", function (root, nodeNamesArray, next) {
		var newlist = utils.filterEditableSync(nodeNamesArray);
		var cleanList = _.intersection(nodeNamesArray, newlist);
		
		for (var i = 0; i < nodeNamesArray.length; i++) {
			if (nodeNamesArray[i][0] === '.' ) {
				nodeNamesArray.splice(i,1);
			}
		}

		for (var i = 0; i < nodeNamesArray.length; i++) {
			if (!_.contains(cleanList, nodeNamesArray[i]) ) {
				nodeNamesArray.splice(i,1);
			}
		}

	});

	walker.on('file', function(root, stat, next) {
		var fullPath, contents, re;
		fullPath = nodePath.resolve(root, stat.name);	
		if (stat.name[0] === '_' ) {
			if (stat.type == "file") {
				contents = fs.readFileSync(fullPath, 'utf8');
				re = /([=|\s]yield)/i;
				if (re.test(contents)) {
					files.push(fullPath.replace(path, ""));		
				}
			}
		}
    next();
	});

	walker.on('end', function() {
		callback(null, files);
	});
}

// Given a folder, return only the layouts that are appropiate.
// TODO - Layouts can inherit from the base!
exports.layoutsForScope = function(layouts, scope) {
	var layoutsParts, fil, scopeParts, filteredLayouts, hasRootLayout;
	if (!scope) return;

	// Remove Leading Splash
	layouts = _.map(layouts, function(item){ 
		if (item[0] == nodePath.sep) {
			return item.substring(1)
		}
	});


	layoutsParts = _.map(layouts, function(item){ 
		return item.split(nodePath.sep);
	});

	if (scope[0] == nodePath.sep) {
		scope = scope.substring(1)
	}
	
	scopeParts = scope.split(nodePath.sep);

	filteredLayouts = [];
	
	// Handle root case seperatly
	if(scopeParts.length == 1) {
		for (var i = 0; i < layoutsParts.length; i++) {
			if (layoutsParts[i].length == 1) {
				filteredLayouts.push(layoutsParts[i].pop())
			}
		}
	} else {
		// This gets a little more tricky
		// POP off the last element
		scopeParts.pop();
		hasRootLayout = false;

		for (var i = 0; i < layoutsParts.length; i++) {
			if (layoutsParts[i].length == 1) {
				var bit = utils.removeExtension(layoutsParts[i][0]);
				if (bit == "_layout") {
					hasRootLayout = true;
				}
			}
		}		

		for (var i = 0; i < layoutsParts.length; i++) {
			var savedPiece = layoutsParts[i].pop();
			
			// Compare the items and all elements
			if (layoutsParts[i].length == scopeParts.length) {
				if (layoutsParts[i].compare(scopeParts)) {
					filteredLayouts.push(savedPiece);
				}
			}
		}
	}

	if (hasRootLayout) {
		filteredLayouts.push("__inherit__")
	}

	return filteredLayouts;
}

// This converts an array of layouts to a key:val set with labels.
// Used for the select dropdown
exports.layoutsForSelect = function(layouts) {
	if (!layouts) return [];
	var optLayouts = [];
	for (var i = 0; i < layouts.length; i++) {
		if (layouts[i] == "_layout.jade" || layouts[i] == "_layout.ejs") {
			optLayouts.push({value:layouts[i], name:'Default Layout'});
		} else if (layouts[i] == "__inherit__") {
			// Special case for sub folders that have a base layout
			optLayouts.push({value:true, name:'Inherit Base Layout'});
	  } else {
			optLayouts.push({value:layouts[i], name:layouts[i]});	
		}
	}
	optLayouts.push({value:'false', name:'No Layout'});	
	return optLayouts;
}

