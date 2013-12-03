var express 			= require('express');
var _ 		 				= require('underscore');
var passwordHash 	= require('password-hash');
var harp 					= require('harp');
var nodePath 			= require('path');
var busboy 				= require('connect-busboy');
var marked				= require('marked');
var toMarkdown 		= require('to-markdown').toMarkdown;
var flash 				= require('connect-flash');
var config 				= require('./config');
var dynHelpers 		= require('./lib/helpers');
var app 					= express();

var projectPath 	= nodePath.resolve(process.cwd(), config.boilerplate || "");

// Existing
var editor				= require('./lib/editor');
var cfg = editor.loadBoilerPlate(projectPath);

// New
// var editor				= require('./lib/editor')(projectPath);

app.configure(function() {
  app.use(express.cookieParser('play me off keyboard cat'));
  app.use(express.session({ secret: "keyboard cat", cookie: { maxAge: 1000*60*60*24*365 }}));
  app.use(flash());

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(busboy());

  app.use(harp.mount(projectPath));
  app.use(express.static(__dirname + "/public"));
  app.use(dynHelpers.helpers());

  app.set("view engine", "jade");
  app.set('views', __dirname + '/views');

  // Just needed to parse html files
  app.engine('html', require('ejs').renderFile);
});


function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    // res.redirect("/admin");
    next();
  } else {
    next();
  }
}

app.get('/admin', function(req, res){
  res.render("login", { message: req.flash('error') })
});

app.get('/admin/publish', checkAuth, function(req, res) {
	editor.fetchFileByPath(req.query.path, cfg, function(fileContents) {
		var base = editor.utils.reduceFilePart(req.query.path);
		var ext = getExtension(req.query.path);

		if (ext == "md") {
			fileContents = marked(fileContents);
		} 

		editor.getMetaData(editor.utils.normaizeFilePartExt(req.query.path), base, cfg, function(err, metaData){
			editor.layouts.fetchLayouts(cfg, function(err, layouts){
				var layouts = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
				res.render("edit", {nav:'content', file:req.query.path,  contents:fileContents, metaData: metaData, layouts:layouts});
			});
		});
	});
});

// TODO - Handle custom / extra fields
app.post("/admin/publish", checkAuth, function(req, res){
	var content, data, ext, base;

	data = {
		title: req.body.title,
		layout: req.body.layout,
		updated_at: new Date(),
		updated_by: req.session.user_id || "Unknown User"
	};

	data.layout = (data.layout == "true") ? true : data.layout;
	data.layout = (data.layout == "false") ? false : data.layout;

	// Write method needs to know the file extension, so we should pass in the origional
	// If non exists, we can make a best guess or fall back to the system default
	ext = editor.utils.getExtension(req.body.file);
	base = editor.utils.reduceFilePart(req.body.file);

	if (ext == "md") {
		content = toMarkdown(req.body.content);
	} else {
		contents = req.body.content;
	}


	editor.updateMetaData(req.body.slug, base, cfg, data, function(err, result){
		editor.writeFileBySlug(req.body.slug, base, ext, cfg, content, function(fileContents) {
			var existingSlug = editor.utils.normaizeFilePart(req.body.file);
			// If the slug has changed, we need to rename the file.
			if(req.body.slug !== existingSlug) {
			  editor.removeFileBySlug(existingSlug, base, ext, cfg, function(){
			  	editor.removeMetaData(existingSlug, base, cfg, function(err, result){
						res.redirect("/admin/content");
					});
			  });
			} else {
				res.redirect("/admin/content");	
			}
		});
	});
});

// Main content listing.
app.get('/admin/content', checkAuth, function(req, res) {
	editor.fetchFiles(cfg, function(files) {
		var rfiles = editor.utils.filterEditableSync(files);
		editor.sections.fetchSectionsRefined(cfg, function(sections) {
			res.render("content", {nav:'content', files:rfiles, sections: sections});
		});
	});
});

app.get('/admin/content/new', checkAuth, function(req, res) {
	editor.layouts.fetchLayouts(cfg, function(err, layouts){
		var layouts = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
		res.render("content_new",{nav:'content', message: req.flash('error'), layouts:layouts, path:req.query.path});
	});
});

app.del('/admin/content', checkAuth, function(req, res) {
	var slug, ext, base;

	slug = editor.utils.normaizeFilePart(req.body.file)
	ext = editor.utils.getExtension(req.body.file);
	base = editor.utils.reduceFilePart(req.body.file);

	editor.removeFileBySlug(slug, base,  ext, cfg, function(fileContents) {
		editor.removeMetaData(slug, base, cfg, function(err, result){
			res.redirect("/admin/content");
		});
	});
});

app.post('/admin/content/new', checkAuth, function(req, res) {
	var data, slug, base;

	if (req.body.slug == "") {
		req.flash('error', 'Slug is required');
		res.redirect("/admin/content/new?path=" + req.body.path);
	} else {

		// TODO - Does this slug exist already?

		data = {
			type: "page",
			title: req.body.title,
			layout: req.body.layout,
			updated_at: new Date(),
			updated_by: req.session.user_id || "Unknown User"
		};

		data.layout = (data.layout == "true") ? true : data.layout;
		data.layout = (data.layout == "false") ? false : data.layout;

		slug = editor.utils.slug(req.body.slug);
		base = editor.utils.reduceFilePart(req.body.path);

		editor.updateMetaData(slug, base, cfg, data, function(err, result) {
			editor.writeFileBySlug(slug, base, config.defaultFileType, cfg, req.body.content, function(fileContents) {
				res.redirect("/admin/content");
			});
		});
	}
});

app.get('/admin/members', checkAuth, function(req, res){
	res.render("members", {nav:'members', members:cfg.harpJSON.users});
});

app.get("/admin/member/new", checkAuth, function(req, res){
	res.render("new_member", {nav:'members', message:req.flash("error")});
});

app.post("/admin/member/new", checkAuth, function(req, res){
	console.log(req.body)
	if (req.body.username && req.body.password1) {
		if (req.body.password1 !== req.body.password2) {
			req.flash("error", "Passwords don't match");
			res.redirect("/admin/member/new")
		} else {

			var data = {
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				username: req.body.username,
				password: passwordHash.generate(req.body.password1),
				email: req.body.email
			}
			editor.addMember(cfg, data, function(){
				res.redirect("/admin/members")			
			});
		}
	} else {
		req.flash("error", "Username and password is required");
		res.redirect("/admin/member/new")
	}
});

app.get("/admin/entry/new", checkAuth, function(req, res) {
	editor.sections.fetchMetaDataBySection(req.query.path, cfg, function(metaData, root) {
		var fields = editor.metadata.fetchFields(metaData);
		res.render("entry_new", {fields:fields, path: req.query.path});
	});
});


app.post("/admin/entry/new", checkAuth, function(req, res){
	var data, slug, section, content;

	slug 		= editor.utils.slug(req.body.slug);
	section = req.body.section;
	content = toMarkdown(req.body.content);

	delete req.body.slug;
	delete req.body.section;
	delete req.body.content;

	data = {
		type: "entry",
		updated_at: new Date(),
		updated_by: req.session.user_id || "Unknown User"
	};

	data = editor.utils.extend(data, req.body);
	
	editor.sections.sectionToBase(section, cfg, function(base) {
		editor.updateMetaData(slug, base, cfg, data, function(err, result) {
			editor.writeFileBySlug(slug, base, config.defaultFileType, cfg, content, function(fileContents) {
				res.redirect("/admin/lists/" + section);
			});
		});
	});
});

// List section
app.get("/admin/lists/:name", checkAuth, function(req, res) {
	editor.sections.fetchSectionsRefined(cfg, function(sections) {
		editor.sections.fetchMetaDataBySection(req.params.name, cfg, function(metaData, root) {
			res.render("list", {nav:'content', list: req.params.name, listRoot:root, sections: sections, metaData: metaData});	
		});
	});
});

app.get('/admin/settings', function (req, res) {
  res.render('settings', {nav:'settings', message: req.flash('info'), settings:cfg.harpJSON});
});

app.post("/admin/settings", function(req, res){
	editor.updateGlobals(cfg, req.body, function(err, result){
		req.flash('info', 'Settings Saved');
		res.redirect("/admin/settings");	
	});
});

app.get('/admin/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/admin');
});

app.post('/admin/login', function(req, res){
	if (req.body.username != "" && req.body.password != "") {
		if (typeof cfg.harpJSON.users === 'undefined') {
			var data = {
				username: req.body.username,
				password: passwordHash.generate(req.body.password)
			}

			editor.addMember(cfg, data, function(){
				req.session.user_id = req.body.username;
				res.redirect("/admin/content");	
			});
			
		} else {
			var pass = false, user = null;
			for (var i = 0; i < cfg.harpJSON.users.length; i++) {
				if(cfg.harpJSON.users[i].username === req.body.username) {
					if (passwordHash.verify(req.body.password, cfg.harpJSON.users[i].password) == true) {
						pass = true;
						user = req.body.username;
					}
				}
			}

			if (pass) {
				req.session.user_id = user;
				res.redirect("/admin/content");
			} else {
				req.flash('error', 'Invalid Username or Password');
				res.redirect("/admin");				
			}
		}
	} else {
		req.flash('error', 'Username and Password are required');
		res.redirect("/admin");
	}
});

app.listen(config.port);
console.log("Listening on Port", config.port)