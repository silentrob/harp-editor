var express 		= require('express');

var harp 				= require("harp");
var nodePath 		= require('path');
var busboy 			= require('connect-busboy');
var flash 			= require('connect-flash');
var editor			= require("./lib/editor");

var app 				= express();

var dynamicHelpers = require("./lib/helpers");


// Settings
var port = 3000;

// This will come from the CLI
var path = "__ PATH TO BOILERPLATE __";

var projectPath = nodePath.resolve(process.cwd(), path || "");
var cfg = editor.loadBoilerPlate(projectPath);

app.configure(function() {
  app.use(express.cookieParser('keyboard cat'));
  app.use(express.session({ secret: "keyboard cat", cookie: { maxAge: 1000*60*60*24*365 }}));
  app.use(flash());

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(busboy());

	
  app.use(harp.mount(projectPath));

  app.use(express.static(__dirname + "/public"));

  app.use(dynamicHelpers.helpers());

  app.set("view engine", "jade");
  app.set('views', __dirname + '/views');

  // Just needed to parse html files
  app.engine('html', require('ejs').renderFile);
});

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.redirect("/admin");
    // next();
  } else {
    next();
  }
}

app.get('/admin', function(req, res){
  res.render("login", { message: req.flash('error') })
});

// Not really used - Maybe later
// app.get('/admin/home', checkAuth, function(req, res){
//   res.render("home")
// });

app.get('/admin/publish', checkAuth, function(req, res) {
	editor.fetchFileBySlug(req.query.path, cfg, function(fileContents) {
		editor.getMetaData(req.query.path, cfg, function(err, metaData){
			editor.layouts.fetchLayouts(cfg, function(err, layouts){
				var layouts = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
				res.render("edit", {file:req.query.path,  contents:fileContents, metaData: metaData, layouts:layouts});
			});
		});
	});
});

// TODO - Handle custom / extra fields
// TODO - Handle rename
app.post("/admin/publish", checkAuth, function(req, res){

	var data = {
		title: req.body.title,
		layout: req.body.layout,
		updated_at: new Date(),
		updated_by: req.session.user_id || "Unknown User"
	};

	editor.updateMetaData(req.body.file, cfg, data, function(err, result){
		editor.writeFileBySlug(req.body.file, cfg, req.body.content, function(fileContents) {
			res.redirect("/admin/content");
		});
	});
});

// Main content listing.
app.get('/admin/content', checkAuth, function(req, res) {
	editor.fetchFiles(cfg, function(files) {
		var rfiles = editor.utils.filterEditableSync(files);
		editor.fetchSection(cfg, function(sections) {
			res.render("content", {files:rfiles, sections: sections});
		});
	});
});

app.get('/admin/content/new', checkAuth, function(req, res) {
	editor.layouts.fetchLayouts(cfg, function(err, layouts){
		var layouts = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
		res.render("content_new",{message: req.flash('error'), layouts:layouts, path:req.query.path});
	});
});

app.del('/admin/content', checkAuth, function(req, res) {
	editor.removeFileBySlug(req.body.file, cfg, function(fileContents) {
		res.redirect("/admin/content");
	});
});

app.post('/admin/content/new', checkAuth, function(req, res) {
	if (req.body.slug == "") {
		req.flash('error', 'Slug is required');
		res.redirect("/admin/content/new?path=" + req.body.path);
	} else {

		// TODO - Does this slug exist already?
		// Default File type? MD?
		var data = {
			title: req.body.title,
			layout: req.body.layout,
			updated_at: new Date(),
			updated_by: req.session.user_id || "Unknown User"
		};

		editor.updateMetaData(req.body.slug, cfg, data, function(err, result){
			editor.writeFileBySlug(req.body.slug + ".md" , cfg, req.body.content, function(fileContents) {
				res.redirect("/admin/content");
			});
		});
	}
});

// TODO Finish this and POST
app.get('/admin/members', checkAuth, function(req, res){
	res.render("members", {members:cfg.harpJSON.users});
});

app.get("/admin/member/new", checkAuth, function(req, res){
	res.render("new_member");
});

app.post("/admin/member/new", checkAuth, function(req, res){
	console.log(req.body)
	res.redirect("/admin/members")
});

// List section
app.get("/admin/lists/:name", checkAuth, function(req, res){
	editor.fetchSection(cfg, function(sections) {
		editor.fetchMetaDataBySection(req.params.name, cfg, function(metaData, root) {
			res.render("list", { list: req.params.name, listRoot:root, sections: sections, metaData: metaData});
		});
	});
});

app.get('/admin/settings', function (req, res) {
  res.render('settings', {message: req.flash('info'), settings:cfg.harpJSON});
});

app.post("/admin/settings", function(req, res){
	editor.updateGlobals(cfg, req.body, function(err, result){
		req.flash('info', 'Settings Saved');
		res.redirect("/admin/settings");	
	})
	
});

app.get('/admin/logout', function (req, res) {
  delete req.session.user_id;
  res.redirect('/admin');
});

app.post('/admin/login', function(req, res){
	if (req.body.username != "" && req.body.password != "") {
		for (var i = 0; i < cfg.harpJSON.users.length; i++) {
			if(cfg.harpJSON.users[i].username === req.body.username && cfg.harpJSON.users[i].password === req.body.password) {
				req.session.user_id = cfg.harpJSON.users[i].username;
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

app.listen(port);
console.log("Listening on Port", port)