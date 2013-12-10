module.exports = function(editor, config) {
	return {

		all: function(req, res) {
		  editor.files.fetch(function(files) {
		    var rfiles = editor.utils.filterEditableSync(files);
		    editor.sections.fetchSectionsRefined(function(sections) {
		      res.render("content", {nav:'content', files:rfiles, sections: sections});
		    });
		  });
		},

		create: function(req, res) {
		  var data, slug, base;

		  if (req.body.slug === "") {
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
		},

		update: function(req, res){
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
		        debug("Renaming event", req.body.slug, existingSlug);
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
		}, 

		new: function(req, res) {
		  editor.layouts.fetchLayouts(function(err, layouts){
		    var layoutSelect = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
		    res.render("content_new",{nav:'content', message: req.flash('error'), layouts:layoutSelect, path:req.query.path});
		  });
		},

		edit: function(req, res) {
		  editor.files.fetchFileByPath(req.query.path, function(fileContents) {
		    var base = editor.utils.reduceFilePart(req.query.path);
		    var ext = getExtension(req.query.path);
		    if (ext == "md") {
		      fileContents = marked(fileContents);
		    } 
		    editor.metadata.getMetaData(editor.utils.normaizeFilePartExt(req.query.path), base, function(err, metaData){
		      editor.layouts.fetchLayouts(function(err, layouts) {
		        var layoutSelect = editor.layouts.layoutsForSelect(editor.layouts.layoutsForScope(layouts, req.query.path));
		        res.render("edit", {nav:'content', file:req.query.path, 'contents':fileContents, 'metaData': metaData, 'layouts':layoutSelect});
		      });
		    });
		  });
		},

		del: function(req, res) {
		  var slug, ext, base;

		  slug = editor.utils.normaizeFilePart(req.body.file);
		  ext = editor.utils.getExtension(req.body.file);
		  base = editor.utils.reduceFilePart(req.body.file);

		  editor.files.removeFileBySlug(slug, base,  ext, function(fileContents) {
		    editor.metadata.removeMetaData(slug, base, function(err, result){
		      res.redirect("/admin/content");
		    });
		  });
		}

	}
};


