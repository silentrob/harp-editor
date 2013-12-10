var nodePath    = require('path');
var fs          = require('fs');
var walk        = require('walk');
var _           = require('underscore');
var nodeSlug    = require('slug');
var utils       = require('./utils');

module.exports = function(cfg) {

  // Given the contens of the metaData return a list of fields needed to create a new entry.
  var fetchFields = function(metaData) {
    var fields = [], list, type, prop;

    // Defined by Boilerplate Author
    if (metaData && metaData.editor && metaData.editor.fields) {
      for (prop in metaData.editor.fields) {
        var data = metaData.editor.fields[prop];
        if (_.isString(data)) {
          fields.push({name: prop, type: data});
        } else if (_.isObject(data)) {
          fields.push(utils.extend({name: prop}, data));
        }
      } 
    } else {
      // Defined by best guess.
      for (var item in metaData) {
        // Remove or skip over editor and other config keys.
        if (!_.contains(['editor'], item)) {
          for (prop in metaData[item]) {
            // Remove some common propery names, keywords or reserved.
            if (!_.contains(['layout', 'updated_at','updated_by','type'], prop)) {
              if (_.isString(metaData[item][prop])) {
                type = (metaData[item][prop].length <= 40) ? "text" : "textarea";
              } else if (_.isArray(metaData[item][prop])){
                type = "select";
              } else {
                type = "text";
              }

              // Special consideration for key name
              if (prop == 'date') {
                type = "date";
              }
              
              fields.push({name: prop, type: type});
            }
          }   
        }
      }
    }

    if (metaData && metaData.editor && !_.isUndefined(metaData.editor.content)) {
      fields.push({"content": metaData.editor.content});  
    }

    return _.uniq(fields, function(item, index, list) {
        return item.name;
    });
  };

  // first pass 
  var updateTableFields = function(base, reqBody, callback) {
    var data = {
      table: Object.keys(reqBody)
    };
    // TODO extend and mixin field data.
    updateMetaData("editor", base, data, callback);
  };

  // Given slug, and data, update the _data.json with data
  var updateMetaData = function(slug, base, data, callback) {
    var key, contents;
    
    slug = nodeSlug(slug);

    fetchDataJSONPath(slug, base, function(err, path) {
      if (err) {
        callback(err, null);
      } else {

        key = utils.normaizeFilePart(slug);
        contents = require(path);
        if (contents[key]) {
          contents[key] = utils.extend(contents[key], data);  
        } else {
          contents[key] = data;
        }
        
        fs.writeFile(path, JSON.stringify(contents, null, 2), function(err) {
          callback(err, null);  
        });
      }
    });
  };

  var removeMetaData = function(slug, base, callback) {
    var contents, key;

    slug = nodeSlug(slug);

    fetchDataJSONPath(slug, base, function(err, path) {
      if (err) {
        callback(err, null);
      } else {

        key = utils.normaizeFilePart(slug);
        contents = require(path);
        delete contents[key];
        fs.writeFile(path, JSON.stringify(contents, null, 2), function(err) {
          callback(err, null);  
        });
      }
    });
  };

  // Simular API to update, but returns the data
  var getMetaData = function(slug, base, callback) {
    var key, contents;

    slug = nodeSlug(slug).toLowerCase();

    fetchDataJSONPath(slug, base, function(err, path){
      if (err) {
        callback(err, null);
      } else {
        key = utils.normaizeFilePart(slug);
        contents = require(path); // This does the JSON dance too, nice!
        if (contents[key] !== undefined) {
          // TODO test for invalid JSON
          callback(null, contents[key]);
        } else {
          callback(null, {});
        }
      }
    });
  };

  // Given a slug return the _data.json file or create one if non exists
  var fetchDataJSONPath = function(slug, base, callback) {
    var finalLocation, fullPath, parts, filePart, filePath;

    filePart = (slug[0] === nodePath.sep) ? slug : nodePath.sep + slug;
    
    filePart = "." + filePart;
    filePath = nodePath.resolve(base, filePart);
    fullPath = cfg.appPublic + filePath;
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
  };

  return {
    fetchFields:      fetchFields,
    updateMetaData:   updateMetaData,
    removeMetaData:   removeMetaData,
    getMetaData:      getMetaData,
    updateTableFields: updateTableFields
  };
};