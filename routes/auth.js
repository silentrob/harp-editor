var passwordHash 	= require('password-hash');

module.exports = function(editor) {
	return {
		logout: function (req, res) {
		  delete req.session.user_id;
		  res.redirect('/admin');
		},

		login: function(req, res){
			editor.harp.getMembers(function(err, members){
				if (members.length == 0) {
					// No users, lets create one
					editor.harp.addMember(req.body, function(err){ 
						if (err) {
							req.flash('error', err.message);
							res.redirect("/admin");
						} else {
							req.session.user_id = req.body.username;
							res.redirect("/admin/content");
						}
					});
				} else {
					// Login flow
					editor.harp.getMember(req.body.username, function(err, user){
						if (passwordHash.verify(req.body.password, user.password) == true) {
							req.session.user_id = req.body.username;
							res.redirect("/admin/content");
						} else {
							req.flash('error', 'Invalid Username or Password');
							res.redirect("/admin");				
						}
					});
				}
			});
		}
	}
}

