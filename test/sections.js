var should 	= require("should");
var utils 	= require("../lib/utils");
var fse 		= require("fs-extra");
var path 		= require('path');

var config 				= require('./config/config');

var inDir = path.resolve(process.cwd(), "test", "in");
var outDir = path.resolve(process.cwd(), "test", "out");
var editor;

before(function(done){
	fse.copy(inDir, outDir, function(){
		editor = require('../lib/editor')(config.boilerplate);
		done();
	});
});

describe('sections', function(){
  

  // Returns the sections with all files as an object
  describe('#fetchSection()', function(){
  	it('editor.sections should have function', function(){
	  	editor.sections.should.have.property("fetchSection");
	 	});

  	it('editor.sections.fetchSection() should fetch sections', function(done){
	  	editor.sections.fetchSection(function(result) {
	  		// root, blog, authors
	  		Object.keys(result).should.have.length(3)
	  		result.should.be.an.Object
	  		done();
	  	});
	 	});
  });


  // Returns the sections available as an array, some filtering is done to clean up the list.
  // This method looks at the _data.json for each section to make a more susinct list.
  describe('#fetchSectionsRefined()', function(){
  	it('editor.sections should have function', function(){
	  	editor.sections.should.have.property("fetchSectionsRefined");
	 	});

  	it('editor.sections.fetchSectionsRefined() should fetch sections', function(done){
	  	editor.sections.fetchSectionsRefined(function(result) {
	  		console.log(result)
	  		// [root, blog, authors]
	  		result.should.have.length(3)
	  		result.should.be.an.Array
	  		done();
	  	});
	 	});
  });  

});

after(function(done){
  fse.remove(outDir, done);
});
