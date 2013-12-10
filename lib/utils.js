var _           = require('underscore');
var nodePath    = require('path');
var nodeSlug    = require('slug');

exports.slug = function(slug) {
  return nodeSlug(slug).toLowerCase();
};

// Given an array of files, remove non-editable types.
// We just want html, markdown jade and ejs
// Tested
exports.filterEditableSync = function(fileArray) {
  var i, filteredFiles = [], 
    types = ["html", "md", "jade", "ejs", "xml.jade"], 
    ntypes = ["css", "js", "images", "img", ".git"];

  for(i = 0; i < fileArray.length; i++) {
    if (_.contains(types, getExtension(fileArray[i]))) {
      filteredFiles.push(fileArray[i]);
    }
  }

  // Second Pass
  return _.filter(filteredFiles, function(item) {
    return !_.some(_.map(ntypes, function(r){
      return (item.indexOf(r) !== -1);
    }));
  });
};

// clean up the filepart and return a clean key for _data.json
// Tested
exports.normaizeFilePart =  function(filePart) {
  var tail, ext;
  if (!filePart) return "";

  tail = normaizeFilePartExt(filePart);
  ext = getExtension(tail);

  return tail.replace("." + ext, "");
};

// Same normaizeFilePart, but keys file extension in tact.
// Tested
exports.normaizeFilePartExt = normaizeFilePartExt =  function(filePart) {
  var parts, tail, ext;
  if (!filePart) return "";

  parts = filePart.split(nodePath.sep);
  tail = parts.pop();

  return tail;
};

// For creating files in sub folders, we need to reduce the path
// Tested
exports.reduceFilePart = function(filePart) {
  var parts, tail, ext;
  if (!filePart) return nodePath.sep;

  parts = filePart.split(nodePath.sep);
  if (parts.length <= 2) {
    return nodePath.sep;
  } else {
    parts.pop();  
    return parts.join(nodePath.sep) + nodePath.sep;
  }
};

// Tested
exports.removeExtension = function(filePart) {
  if (_.isUndefined(filePart)) throw Error("filePart is undefined");

  var ext = getExtension(filePart);
  return filePart.replace("." + ext, "");
};

// Tested
exports.getExtension = getExtension = function(filePart) {
  if (_.isUndefined(filePart)) throw Error("Filename is undefined");
  var ext = nodePath.extname(filePart).split('.');
  // The extension may be compounded because the file is not compiled.
  var transposed = ext[ext.length - 1];
  if (_.contains(["ejs","jade"], transposed)) {
    var parts = filePart.split(".");
    parts.shift();
    return parts.join('.')
  } else {
    return ext[ext.length - 1];  
  }
  
};

exports.extend = function (destination, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      destination[k] = source[k];
    }
  }
  return destination; 
};