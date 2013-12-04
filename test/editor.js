var should 	= require("should");
var utils 	= require("../lib/utils");

var config 				= require('./config/config');
var editor				= require('../lib/editor')(config.boilerplate);

describe('Editor', function(){
  describe('Should Create Editor', function(){
  	it('should have some properties', function(){
	  	editor.should.have.property("files");
	  	editor.should.have.property("sections");
	  	editor.should.have.property("layouts");
	  	editor.should.have.property("utils");
	  	editor.should.have.property("harpJSON");
	 	});
  });
});
