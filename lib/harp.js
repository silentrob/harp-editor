//
// The file is named after harp.json
// 

var fs 						= require('fs');
var _ 						= require("underscore");
var passwordHash 	= require('password-hash');


module.exports = function(cfg) {

	var getMember = function(username, callback) {
		var user = {};
		var users = _.isUndefined(cfg.harpJSON['users']) ? [] : cfg.harpJSON['users'];
		for (var i = 0; i < users.length; i++) {
			if (users[i].username === username) {
				user = users[i];
			}
		}
		callback(null, user);
	}

	return {

		// Update just the Global block of the Harp.JSON
		updateGlobals: function(data, callback) {
			cfg.harpJSON['globals'] = data;
			fs.writeFile(cfg.harpJSONPath, JSON.stringify(cfg.harpJSON, null, 2), function(err){
				callback(err, null);	
			});
		},

		// Simple shim on top of harpJSON
		getGlobals: function(callback) {
			var globals = _.isUndefined(cfg.harpJSON['globals']) ? [] : cfg.harpJSON['globals'];
			callback(null, globals);
		},

		// This will create a new user. Username and Password are required.
		// If the password is plain text we will SHA it.
		// Other data params will be passed though like a boss.
		addMember: function(data, callback) {
		
			if (_.isUndefined(cfg.harpJSON['users'])){
				cfg.harpJSON['users'] = [];
			}

			if (!data['username'] || !data['password']) {
				callback(new Error("Username and Password are Required"));
			} else {

				// Username check
				getMember(data['username'], function(err, user){
					if (_.isEmpty(user)) {
						// Password check
						if (!passwordHash.isHashed(data['password'])) {
							data['password'] = passwordHash.generate(data['password']);
						} else {
							data['password'] = data['password'];
						}

						cfg.harpJSON['users'].push(data);
						fs.writeFile(cfg.harpJSONPath, JSON.stringify(cfg.harpJSON, null, 2), function(err){
							callback(err, null);	
						});
					} else {
						callback(new Error("Username already exists"), null);
					}
				});
			}
		},

		getMember: getMember,

		// Simple shim on top of harpJSON
		getMembers: function(callback) {
			var users = _.isUndefined(cfg.harpJSON['users']) ? [] : cfg.harpJSON['users'];
			callback(null, users);
		}
	}
}