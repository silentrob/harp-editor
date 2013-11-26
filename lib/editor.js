var nodePath 		= require('path');
var fs 					= require("fs");
var walk    		= require('walk');
var _ 					= require("underscore");

var layouts 		= require("./layouts");
var utils 			= require("./utils");

var loadJSON = function(harpJSONPath) {
	// if Path is null create a new config? I need to know the app style
	// This might be to simple, if file in valid or empty etc.
	return require(harpJSONPath);
}

var appStyle = function(path) {
	var s1, s2;

	s1 = nodePath.resolve(path, "harp.json");
	s2 = nodePath.resolve(path, "_harp.json");

	return (fs.existsSync(s2) === true) ? true : 
		(fs.existsSync(s1) === false && fs.existsSync(s2) === false) ? 
			!fs.existsSync(nodePath.resolve(path, "public")) : false;
}

var harpJSON = function(path) {
	var s1, s2;

	s1 = nodePath.resolve(path, "harp.json");
	s2 = nodePath.resolve(path, "_harp.json");

	return (fs.existsSync(s2) === true) ? s2 :
		(fs.existsSync(s1) === false && fs.existsSync(s2) === false) ? null : s1;
}

// Writes out a file to disk given a slug.
// Okay, we have slugs, keys, and fileparts, this works with both slugs and fileparts
exports.writeFileBySlug = function(slug, cfg, contents, callback) {
	var projectPath = cfg.appPublic, filePart;
	filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
	fetchFiles(cfg, function(files){
		// Im not exactly sure why we need to check this...
		if(_.contains(files, slug)) {
			fs.writeFile(nodePath.resolve(projectPath + filePart), contents, function(err, contents){
				if (err) console.log(err);
				callback(contents);
			});
		} else {
			fs.writeFile(nodePath.resolve(projectPath + filePart), contents, function(err, contents){
				if (err) console.log(err);
				callback(contents);
			});
		}
	});
}

// This is driven by the edit Contents
exports.fetchFileBySlug = function(slug, cfg, callback) {
	var projectPath = cfg.appPublic, filePart;
	filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
	fetchFiles(cfg, function(files){
		if(_.contains(files, slug)) {
			fs.readFile(nodePath.resolve(projectPath + filePart), 'utf8', function(err, contents){
				callback(contents);
			});
		} else {
			callback("");
		}
	});
}

exports.removeFileBySlug = function(slug, cfg, callback) {
	var projectPath = cfg.appPublic, filePart;
	filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
	fetchFiles(cfg, function(files){
		if(_.contains(files, slug)) {
			fs.unlink(nodePath.resolve(projectPath + filePart), function(err){
				if (err) console.log(err);
				callback(err, null);
			});
		} else {
			callback(null, null);
		}
	});
}

exports.getExtension = getExtension = function(filename) {
	var ext = nodePath.extname(filename||'').split('.');
	return ext[ext.length - 1];
}


exports.fetchFiles = fetchFiles = function(cfg, callback) {
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

// Sections are folders with a _data.json
exports.fetchSection = fetchSection = function(cfg, callback) {
	var files = [], editNodes = [], walker, path;
	
	path = cfg.appPublic;
	walker = walk.walk(path, { followLinks: false });
	
	walker.on("names", function (root, nodeNamesArray) {
		// Remove hidden files
		for (var i = 0; i < nodeNamesArray.length; i++) {
			if (nodeNamesArray[i][0] === '.') {
				nodeNamesArray.splice(i,1);
			}

			if(nodeNamesArray[i] === "_data.json") {
				editNodes.push(root);
			}
		}
	});

	walker.on('file', function(root, stat, next) {
		if (_.contains(editNodes, root)) {
			var fullPath = nodePath.resolve(root, stat.name);
    	files.push(fullPath.replace(path, ""));
		}
    next();
	});

	walker.on('end', function() {
		var clean = [];
		for (var i = 0; i < editNodes.length;i++) {
			var tail, last;
			tail = editNodes[i].split("/")
			last = tail.pop();
			clean.push(last);
		}
		var res = _.groupBy(files, function(file){
			var nodes, type, index;
			nodes = file.split("/");
			type = (_.intersection(clean, nodes)).pop();
			index = nodes.indexOf(type);
			return (nodes[index] == undefined) ? "root" : nodes[index];
		});

		callback(res);
	});
}

// Update just the Global block of the Harp.JSON
exports.updateGlobals = function(cfg, data, callback) {
	cfg.harpJSON['globals'] = data;
	fs.writeFile(cfg.harpJSONPath, JSON.stringify(cfg.harpJSON, null, 2), function(err){
		callback(err, null);	
	});
}


// Given slug, cfg and data, update the _data.json with data
exports.updateMetaData = function(slug, cfg, data, callback) {
	var key, contents;
	fetchDataJSONPath(slug, cfg, function(err, path){
		if (err) {
			callback(err, null);
		} else {
			key = normaizeSlug(slug);
			contents = require(path);
			contents[key] = data;
			fs.writeFile(path, JSON.stringify(contents, null, 2), function(err){
				callback(err, null);	
			});
		}
	});
}

// Simular API to update, but returns the data
exports.getMetaData = function(slug, cfg, callback) {
	var key, contents;
	fetchDataJSONPath(slug, cfg, function(err, path){
		if (err) {
			callback(err, null);
		} else {
			key = normaizeSlug(slug);
			contents = require(path); // This does the JSON dance too, nice!
			if (contents[key] !== undefined) {
				// TODO test for invalid JSON
				callback(null, contents[key]);
			} else {
				callback(null, {});
			}
		}
	});
}

// Given a section name (as defined by fetchSection) return the metadata (_data.json)
// We already know we have a `_data.json` file, unless it was JUST deleted?
// We could have a section to slug lookup
// We pass back the nest as root param too
exports.fetchMetaDataBySection = function(section, cfg, callback) {
	var sectionFiles = [], slug, root;
	fetchSection(cfg, function(sections) {
		for (var sect in sections) {
			if (section == sect) {
				sectionFiles = sections[sect];
			}
		}

		// The Slug could be nested, so we need to actually verify it by lookup.
		slug = _.find(sectionFiles, function(ele) {
			var parts, tail;
			parts = ele.split(nodePath.sep);
			tail = parts.pop();
			if (tail == "_data.json") {
				root = parts.join(nodePath.sep);
				return true;
			}
		});

		var metaData = require(nodePath.resolve(cfg.appPublic + slug));
		callback(metaData, root);

	});
}



// Given a slug return the _data.json file or create one if non exists
// TODO make sure slug is not filepart
exports.fetchDataJSONPath = fetchDataJSONPath = function(slug, cfg, callback) {
	var finalLocation, fullPath, parts;

	fullPath = cfg.appPublic + slug;
	parts = fullPath.split(nodePath.sep);
	parts.pop();

	finalLocation = nodePath.resolve(parts.join(nodePath.sep), "_data.json");

	if (fs.existsSync(finalLocation)) {
		callback(null, finalLocation);
	} else {
		fs.writeFile(finalLocation, "{}", function(err){
			if (err) {
				callback(err, null);
			} else {
				callback(null, finalLocation);
			}
		});
	}
}

// clean up the slug / filepart and return a clean key for _data.json
exports.normaizeSlug = normaizeSlug =  function(filePart) {
	var parts, tail, ext;
	if (!filePart) return "";

	parts = filePart.split(nodePath.sep);
	tail = parts.pop();
	ext = getExtension(tail);
  return tail.replace("." + ext, "");
}

exports.loadBoilerPlate = function(path) {
	var harpJSONPath, harpJSONData, appPublic;
	
	harpJSONPath = harpJSON(path);
	harpJSONData = loadJSON(harpJSONPath);

	appPublic = (appStyle(path)) ? path : nodePath.resolve(path, "public");

	return {
		appRoot: path,
		appPublic: appPublic,
		rootApplication : appStyle(path),
		harpJSONPath: harpJSONPath,
		harpJSON: 		harpJSONData
	}
}

exports.layouts = layouts;
exports.utils 	= utils;

// attach the .compare method to Array's prototype to call it on any array
Array.prototype.compare = function (array) {
  // if the other array is a falsy value, return
  if (!array)
		return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length)
  	return false;

  for (var i = 0; i < this.length; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].compare(array[i]))
				return false;
    }
    else if (this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
		return false;
    }
  }
  return true;
}