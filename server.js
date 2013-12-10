var express       = require('express');
var _             = require('underscore');
var harp          = require('harp');
var nodePath      = require('path');
var busboy        = require('connect-busboy');
var flash         = require('connect-flash');
var debug         = require('debug')('app');
var config        = require('./config');

var dynHelpers    = require('./lib/helpers');
var app           = express();

var projectPath   = nodePath.resolve(process.cwd(), config.boilerplate || "");
var editor        = require('./lib/editor')(projectPath);

// Routes
var auth          = require("./routes/auth")(editor);
var members       = require("./routes/members")(editor);
var settings      = require("./routes/settings")(editor);
var pages         = require("./routes/pages")(editor, config);
var entries       = require("./routes/entries")(editor);

app.configure(function () {
  app.use(express.cookieParser('play me off keyboard cat'));
  app.use(express.session({ secret: "keyboard cat", cookie: { maxAge: 31536000000 }})); // 1000*60*60*24*365
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
    res.redirect("/admin");
    // next();
  } else {
    next();
  }
}

// Pages Resource
// TODO - Rename these routes to pages
app.get('/admin/content', checkAuth, pages.all);
app.get('/admin/content/new', checkAuth, pages.new);
app.post('/admin/content/new', checkAuth, pages.create);
app.post('/admin/publish', checkAuth, pages.update);
app.get('/admin/publish', checkAuth, pages.edit);
app.del('/admin/content', checkAuth, pages.del);

// Entries
app.get("/admin/lists/:name", checkAuth, entries.all);
app.get("/admin/entry/new", checkAuth, entries.new);
app.post("/admin/entry/new", checkAuth, entries.create);


// List section editor
// This is for editing the editor Metadata
// TODO should be ADMIN only
app.get("/admin/entries/:name/edit", checkAuth, function(req, res) {
  editor.sections.fetchSectionsRefined(function(sections) {
    editor.sections.fetchMetaDataBySection(req.params.name, function(metaData, root) {
      
      var fields = editor.metadata.fetchFields(metaData);
      var table = (metaData.editor && metaData.editor.table) ? metaData.editor.table : [];
    
      res.render("entries/list_edit", {nav:'content', table:table,  fields: fields, list: req.params.name, sections: sections});  
      
    });
  });
});

app.post("/admin/entries/:name/edit/table", checkAuth, function(req, res) { 
  editor.sections.sectionToBase(req.params.name, function(base) {
    editor.metadata.updateTableFields(base, req.body, function(err, result){
      res.redirect("/admin/lists/" + req.params.name ); 
    });
  });
});

app.post("/admin/entries/:name/edit/content", checkAuth, function(req, res) { 

  editor.sections.sectionToBase(req.params.name, function(base) {
    editor.metadata.updateTableFields(base, req.body, function(err, result){
      res.redirect("/admin/lists/" + req.params.name ); 
    });
  });
});

// Settings
app.get("/admin/settings", checkAuth, settings.get);
app.post("/admin/settings", checkAuth, settings.update);

// Members
app.get("/admin/members", checkAuth, members.all);
app.get("/admin/member/new", checkAuth, members.get);
app.post("/admin/member/new", checkAuth, members.new);

// Auth
app.get('/admin', auth.new);
app.get("/admin/logout", auth.logout);
app.post("/admin/login", auth.login);

// App Startup
app.listen(config.port);
console.log("Listening on Port", config.port);