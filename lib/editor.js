var nodePath 		= require('path');
var fs 					= require('fs');
var walk    		= require('walk');
var _ 					= require('underscore');
var nodeSlug		= require('slug');

var layouts 		= require('./layouts');
var utils 			= require('./utils');
var sections 		= require('./sections');
var metadata 		= require('./metadata');
var files				= require('./files');
var debug				= require('debug')("editor");

var publicFolder = "public";

module.exports = function(config) {
	debug("Loading Config file", config);

	var config = loadBoilerPlate(config);

	return {
		files 		: files(config),
		sections 	: sections(config),
		layouts  	: layouts(config),
		metadata	: metadata(config),
		utils 	 	: utils,
		harpJSON 	: config.harpJSON
	}
}

var loadBoilerPlate = function(path) {
		var harpJSONPath, harpJSONData, appPublic;
		
		harpJSONPath = harpJSON(path);
		harpJSONData = loadJSON(harpJSONPath);

		appPublic = (appStyle(path)) ? path : nodePath.resolve(path, publicFolder);
	
		return {
			appRoot: path,
			appPublic: appPublic,
			rootApplication : appStyle(path),
			harpJSONPath: harpJSONPath,
			harpJSON: 		harpJSONData
		}
	}

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
			!fs.existsSync(nodePath.resolve(path, publicFolder)) : false;
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
// Clearly we have added more args then is idea.. Refactor maybe?
exports.writeFileBySlug = function(slug, base, ext, contents, callback) {
	var projectPath = cfg.appPublic, filePart, filePath;
	
	// TODO - Test to see if there is already a extension before calling slug
	slug = nodeSlug(slug);

	filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
	// Make the filePart local / relative, so it will resove to base
	filePart = "." + filePart + "." + ext;
	filePath = nodePath.resolve(base, filePart);
	fetchFiles(cfg, function(files){
		// slugs may or may not have an extension.
		// if we dont have one, we need to refer to the table.
		if(_.contains(files, slug)) {
			fs.writeFile(nodePath.resolve(projectPath + filePath), contents, function(err, contents){
				if (err) console.log(err);
				callback(contents);
			});
		} else {
			fs.writeFile(nodePath.resolve(projectPath + filePath), contents, function(err, contents){
				if (err) console.log(err);
				callback(contents);
			});
		}
	});
}

exports.removeFileBySlug = function(slug, base, ext, callback) {
	var projectPath = cfg.appPublic, filePart, filePath;
	slug = nodeSlug(slug);
	filePart = (slug[0] == nodePath.sep) ? slug : nodePath.sep + slug;
	
	filePart = "." + filePart + "." + ext;
	filePath = nodePath.resolve(base, filePart);
	fetchFiles(cfg, function(files){
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

// Update just the Global block of the Harp.JSON
exports.updateGlobals = function(data, callback) {
	cfg.harpJSON['globals'] = data;
	fs.writeFile(cfg.harpJSONPath, JSON.stringify(cfg.harpJSON, null, 2), function(err){
		callback(err, null);	
	});
}

exports.addMember = function(data, callback) {
	// First account - lets just create it
	if (typeof cfg.harpJSON['users'] === "undefined") {
		cfg.harpJSON['users'] = [];
	}

	cfg.harpJSON['users'].push(data);
	fs.writeFile(cfg.harpJSONPath, JSON.stringify(cfg.harpJSON, null, 2), function(err){
		// Reload config
		cfg = loadBoilerPlate(cfg.appRoot);

		callback(null, null);	
	});
}

