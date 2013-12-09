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

describe('metadata', function(){
  
  describe('#updateMetaData()', function(){
  	it('editor.metadata should have function', function(){
	  	editor.metadata.should.have.property("updateMetaData");
	 	});

  	it('editor.metadata.updateMetaData() should update metadata', function(done){
	  	editor.metadata.updateMetaData("blog", "/", {"key":true}, function(err, result) {
	  		should.not.exist(err);
	  		done();
	  	});
	 	});

  });

  describe('#getMetaData()', function(){
  	it('editor.metadata should have function', function(){
	  	editor.metadata.should.have.property("getMetaData");
	 	});

  	it('editor.metadata.getMetaData() should get metadata', function(done){
	  	editor.metadata.getMetaData("blog", "/",  function(err, result) {
	  		should.not.exist(err);
	  		result.should.have.property("key", true)
	  		done();
	  	});
	 	});

  });

});

after(function(done){
  fse.remove(outDir, done);
});
