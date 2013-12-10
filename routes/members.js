module.exports = function(editor) {
	return {

		/**
		 * Method: GET
		 * Gets all members for index view
		 */
		all: function(req, res){
			editor.harp.getMembers(function(err, members){
				res.render("members/all", {nav:'members', members:members });	
			});
		},

		/**
		 * Method: GET
		 * This is the request to show a form to create a new member
		 */
		get: function(req, res){
			res.render("members/new", {nav:'members', message:req.flash("error")});
		},

		/**
		 * Method: POST
		 * This is the request to create a new member
		 */
		new: function(req, res){
			if (req.body.username && req.body.password1) {
				if (req.body.password1 !== req.body.password2) {
					req.flash("error", "Passwords don't match");
					res.redirect("/admin/member/new");
				} else {

					var data = {
						first_name: req.body.first_name,
						last_name: req.body.last_name,
						username: req.body.username,
						password: req.body.password1,
						email: req.body.email
					};

					editor.harp.addMember(data, function(){
						res.redirect("/admin/members");
					});

				}
			} else {
				req.flash("error", "Username and password is required");
				res.redirect("/admin/member/new");
			}
		}
	};
};