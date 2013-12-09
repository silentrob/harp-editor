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

describe('files', function(){
  
  describe('Basic check on methods', function(){
  	it('editor.files should have some functions', function(){
	  	editor.files.should.have.property("fetch");
	  	editor.files.should.have.property("writeFileBySlug");
	  	editor.files.should.have.property("removeFileBySlug");
	  	editor.files.should.have.property("fetchFileByPath");
	 	});
  });

  describe('#fetch()', function(){
  	it('editor.metadata.fetch() should fetch files', function(done){
	  	editor.files.fetch(function(files){
	  		files.should.be.an.Array;
	  		files.should.have.length(30);
	  		done();
	  	})
	 	});
  });

  describe('#writeFileBySlug()', function(){
  	it('editor.metadata.writeFileBySlug() should write a new file', function(done){
	  	editor.files.writeFileBySlug("new_file_test", "/", "md", "Testing", function(contents){
	  		contents.should.be.an.String;
	  		contents.should.eql("Testing");
	  		editor.files.fetch(function(files){
	  			files.should.have.length(31);
	  			done();
	  		});
	  	})
	 	});
  });


  describe('#removeFileBySlug()', function(){
  	it('editor.metadata.removeFileBySlug() should write a new file', function(done){
	  	editor.files.removeFileBySlug("new_file_test", "/", "md", function(err){
	  		should.not.exist(err);
	  		
	  		editor.files.fetch(function(files){
	  			files.should.have.length(30);
	  			done();
	  		});
	  	})
	 	});
  });

});

after(function(done){
	fse.remove(outDir, done);
});
