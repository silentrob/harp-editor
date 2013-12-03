var nodePath 		= require('path');
var walk    		= require('walk');
var _ 					= require('underscore');
var async 			= require('async');

// Sections are folders with a _data.json
// This function returns all sections with a _data.json
exports.fetchSection  = fetchSection = function(cfg, callback) {
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

// Takes a metaData object and returns true, false if there are entries
// This assumes you know the sections and have already fetched the metaData
exports.refineSection = refineSection = function(sectionMetaData) {
	var result = false;
	for (var i in sectionMetaData) {
		if (sectionMetaData[i].type == undefined || sectionMetaData[i].type == "entry") {
			result = true;
		}
	}
	return result;
}

exports.fetchSectionsRefined = function(cfg, callback) {
	fetchSection(cfg, function(sections){
		var sec = Object.keys(sections);
		var itor = function(item, next) {
			fetchMetaDataBySection(item, cfg, function(metaData){
				next(refineSection(metaData));
			});
		}
		async.filter(sec, itor, function(res){
			callback(res);
		});
	});
}

// Given a section name (as defined by fetchSection) return the metadata (_data.json)
// We already know we have a `_data.json` file, unless it was JUST deleted?
// We could have a section to slug lookup
// We pass back the nest as root param too
exports.fetchMetaDataBySection = fetchMetaDataBySection = function(section, cfg, callback) {
	var sectionFiles = [], slug, root;
	fetchSection(cfg, function(sections) {
		for (var sect in sections) {
			if (section == sect) {
				sectionFiles = sections[sect];
			}
		}

		// The Slug could be nested, so we need to actually verify it by lookup.
		// TODO refactor this to use util.normaizeFilePartExt
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

// Given a section, return the base filePart
// This is really a conviencence method for fetchMetaDataBySection
exports.sectionToBase = function(section, cfg, callback) {
	fetchMetaDataBySection(section, cfg, function(a, base){
		callback(base);
	});
}
