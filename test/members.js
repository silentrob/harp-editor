var should 	= require("should");
var utils 	= require("../lib/utils");
var passwordHash 	= require('password-hash');
var fse     = require("fs-extra");
var path    = require('path');

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


describe('Members', function(){
  describe('#getMembers()', function(){
  	it('should have some properties', function(done){
  		editor.harp.getMembers(function(err, members){
  			members.should.be.an.Array;
  			members.should.have.length(0);
  			done();
  		});			
	 	});
  });

  describe('#addMember()', function(){
  	it('should not be able to add with invalid data - Username', function(done){
  		var invalid = {};
  		editor.harp.addMember(invalid, function(err, members){
  			should.exist(err);
  			err.message.should.eql("Username and Password are Required");
  			done();
  		});			
	 	});

  	it('should not create member with invalid data - Password', function(done){
  		var invalid = {"username": "silentrob"};
  		editor.harp.addMember(invalid, function(err, members){
  			should.exist(err);
  			err.message.should.eql("Username and Password are Required");
  			done();
  		});			
	 	});

  	it('should create member with valid data', function(done){
  		var valid = {"username": "silentrob", "password":"qwerty"};
  		editor.harp.addMember(valid, function(err, members){
  			should.not.exist(err);
  			editor.harp.getMembers(function(err, members){
  				members.should.have.length(1);
  				passwordHash.isHashed(members[0].password).should.be.true
  				done();
  			});
  		});			
	 	});

  	it('should not create if username already exists', function(done){
  		var invalid = {"username": "silentrob", "password":"qwerty2"};
  		editor.harp.addMember(invalid, function(err, members){
  			should.exist(err);
  			err.message.should.eql("Username already exists");
  			editor.harp.getMembers(function(err, members){
  				members.should.have.length(1);
  				done();
  			});
  		});			
	 	});

  });
	
	describe('#getMember', function(){
		it('should fetch member by username', function(done){
			editor.harp.getMember('silentrob', function(err, member){
				should.not.exist(err);
				member.should.have.property('username', 'silentrob');
				// console.log(member);
				done();
			});
		});
	});

});

after(function(done){
  fse.remove(outDir, done);
});
