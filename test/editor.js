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

describe('Editor', function(){
  describe('Should Create Editor', function(){
  	it('should have some properties', function(){
	  	editor.should.have.property("files");
	  	editor.should.have.property("sections");
	  	editor.should.have.property("layouts");
	  	editor.should.have.property("utils");
	 	});
  });
});

after(function(done){
	fse.remove(outDir, done);
});
