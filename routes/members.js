module.exports = function(editor) {
	return {

		getMembers: function(req, res){
			editor.harp.getMembers(function(members){
				res.render("members", {nav:'members', members:members });	
			});
		},

		newMemberGet: function(req, res){
			res.render("new_member", {nav:'members', message:req.flash("error")});
		},

		newMember: function(req, res){
			if (req.body.username && req.body.password1) {
				if (req.body.password1 !== req.body.password2) {
					req.flash("error", "Passwords don't match");
					res.redirect("/admin/member/new")
				} else {

					var data = {
						first_name: req.body.first_name,
						last_name: req.body.last_name,
						username: req.body.username,
						password: req.body.password1,
						email: req.body.email
					}
					editor.harp.addMember(data, function(){
						res.redirect("/admin/members")			
					});
				}
			} else {
				req.flash("error", "Username and password is required");
				res.redirect("/admin/member/new")
			}
		}
	}
}