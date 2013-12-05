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
var editor				= require('./lib/editor')(projectPath);

// Routes
var auth 					= require("./routes/auth")(editor);
var members 			= require("./routes/members")(editor);

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
  app.use(dynHelpers.helpers(editor));

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
	editor.files.fetchFileByPath(req.query.path, function(fileContents) {
		var base = editor.utils.reduceFilePart(req.query.path);
		var ext = getExtension(req.query.path);

		if (ext == "md") {
			fileContents = marked(fileContents);
		} 

		editor.metadata.getMetaData(editor.utils.normaizeFilePartExt(req.query.path), base, function(err, metaData){
			editor.layouts.fetchLayouts(function(err, layouts){
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


	editor.metadata.updateMetaData(req.body.slug, base, data, function(err, result){
		editor.files.writeFileBySlug(req.body.slug, base, ext, content, function(fileContents) {
			var existingSlug = editor.utils.normaizeFilePart(req.body.file);
			// If the slug has changed, we need to rename the file.
			if(req.body.slug !== existingSlug) {
			  editor.files.removeFileBySlug(existingSlug, base, ext, function(){
			  	editor.metadata.removeMetaData(existingSlug, base, function(err, result){
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
	editor.files.fetch(function(files) {
		var rfiles = editor.utils.filterEditableSync(files);
		editor.sections.fetchSectionsRefined(function(sections) {
			res.render("content", {nav:'content', files:rfiles, sections: sections});
		});
	});
});

app.get('/admin/content/new', checkAuth, function(req, res) {
	editor.layouts.fetchLayouts(function(err, layouts){
		var layouts = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
		res.render("content_new",{nav:'content', message: req.flash('error'), layouts:layouts, path:req.query.path});
	});
});

app.del('/admin/content', checkAuth, function(req, res) {
	var slug, ext, base;

	slug = editor.utils.normaizeFilePart(req.body.file)
	ext = editor.utils.getExtension(req.body.file);
	base = editor.utils.reduceFilePart(req.body.file);

	editor.files.removeFileBySlug(slug, base,  ext, function(fileContents) {
		editor.metadata.removeMetaData(slug, base, function(err, result){
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

		
		editor.metadata.updateMetaData(slug, base, data, function(err, result) {
			editor.files.writeFileBySlug(slug, base, config.defaultFileType, req.body.content, function(fileContents) {
				res.redirect("/admin/content");
			});
		});
	}
});



app.get("/admin/entry/new", checkAuth, function(req, res) {
	editor.sections.fetchMetaDataBySection(req.query.path, function(metaData, root) {
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
	
	editor.sections.sectionToBase(section, function(base) {
		editor.metadata.updateMetaData(slug, base, data, function(err, result) {
			editor.files.writeFileBySlug(slug, base, config.defaultFileType, content, function(fileContents) {
				res.redirect("/admin/lists/" + section);
			});
		});
	});
});

// List section
app.get("/admin/lists/:name", checkAuth, function(req, res) {
	editor.sections.fetchSectionsRefined(function(sections) {
		editor.sections.fetchMetaDataBySection(req.params.name, function(metaData, root) {
			res.render("list", {nav:'content', list: req.params.name, listRoot:root, sections: sections, metaData: metaData});	
		});
	});
});

app.get('/admin/settings', function (req, res) {
  res.render('settings', {nav:'settings', message: req.flash('info'), settings:editor.harpJSON});
});

app.post("/admin/settings", function(req, res){
	editor.updateGlobals(req.body, function(err, result){
		req.flash('info', 'Settings Saved');
		res.redirect("/admin/settings");	
	});
});


// Members
app.get('/admin/members', checkAuth, members.getMembers);
app.get("/admin/member/new", checkAuth, members.newMemberGet);
app.post("/admin/member/new", checkAuth, members.newMember);

// Auth
app.get('/admin/logout', auth.logout);
app.post('/admin/login', auth.login);


app.listen(config.port);
console.log("Listening on Port", config.port)