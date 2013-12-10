module.exports = function(editor) {
	return {
		
		new: function(req, res) {
		  editor.sections.fetchMetaDataBySection(req.query.path, function(metaData, root) {
		    var fields = editor.metadata.fetchFields(metaData);
		    res.render("entries/new", {fields:fields, path: req.query.path});
		  });
		}, 

		create: function(req, res){
		  var data, slug, section, content;

		  slug    = editor.utils.slug(req.body.slug);
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
		}, 
		
		all: function(req, res) {
		  editor.sections.fetchSectionsRefined(function(sections) {
		    editor.sections.fetchMetaDataBySection(req.params.name, function(metaData, root) {
		      res.render("entries/all", {nav:'content', list: req.params.name, listRoot:root, sections: sections, metaData: metaData});  
		    });
		  });
		}

	};
};
