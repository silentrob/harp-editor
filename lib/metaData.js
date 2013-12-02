var _ = require('underscore');

// Given the contens of the metaData return a list of fields needed to create a new entry.
exports.fetchFields = function(metaData) {
	var fields = [], list, type;

	for (var item in metaData) {
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

	return _.uniq(fields, function(item, index, list) {
			return item.name;
	});
}