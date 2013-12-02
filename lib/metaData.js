var _ 		= require('underscore');
var utils = require('./utils');

// Given the contens of the metaData return a list of fields needed to create a new entry.
exports.fetchFields = function(metaData) {
	var fields = [], list, type;

	// Defined by Boilerplate Author
	if (metaData && metaData.editor && metaData.editor.fields) {
		for (var prop in metaData.editor.fields) {
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
				for (var prop in metaData[item]) {
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
							type = "date"
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
}