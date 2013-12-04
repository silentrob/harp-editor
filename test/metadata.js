var should 	= require("should");
var utils 	= require("../lib/utils");

var config 				= require('./config/config');
var editor				= require('../lib/editor')(config.boilerplate);

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