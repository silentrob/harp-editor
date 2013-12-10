var nodePath    = require('path');
var fs          = require('fs');

var layouts     = require('./layouts');
var utils       = require('./utils');
var sections    = require('./sections');
var metadata    = require('./metadata');
var files       = require('./files');
var harp        = require('./harp');
var debug       = require('debug')("editor");

var publicFolder = "public";

module.exports = function(config) {
  debug("Loading Config file", config);

  config = loadBoilerPlate(config);

  return {
    files     : files(config),
    sections  : sections(config),
    layouts   : layouts(config),
    metadata  : metadata(config),
    harp      : harp(config),
    utils     : utils
  };
};

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
    harpJSON:     harpJSONData
  };
};

var loadJSON = function(harpJSONPath) {
  // if Path is null create a new config? I need to know the app style
  // This might be to simple, if file in valid or empty etc.
  return require(harpJSONPath);
};

var appStyle = function(path) {
  var s1, s2;

  s1 = nodePath.resolve(path, "harp.json");
  s2 = nodePath.resolve(path, "_harp.json");

  return (fs.existsSync(s2) === true) ? true : 
    (fs.existsSync(s1) === false && fs.existsSync(s2) === false) ? 
      !fs.existsSync(nodePath.resolve(path, publicFolder)) : false;
};

var harpJSON = function(path) {
  var s1, s2;

  s1 = nodePath.resolve(path, "harp.json");
  s2 = nodePath.resolve(path, "_harp.json");

  return (fs.existsSync(s2) === true) ? s2 :
    (fs.existsSync(s1) === false && fs.existsSync(s2) === false) ? null : s1;
};