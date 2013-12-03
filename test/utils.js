var should 	= require("should");
var utils 	= require("../lib/utils");

describe('Utils', function(){

	// Reduces The File Part to a base folder
  describe('#reduceFilePart()', function(){
    it('should return / when the value is not present', function(){
			utils.reduceFilePart(undefined).should.eql("/");
			utils.reduceFilePart("").should.eql("/");
    });

    it('should return / when the value has no anchor', function(){
			utils.reduceFilePart("foo").should.eql("/");
			utils.reduceFilePart("foo.md").should.eql("/");
			utils.reduceFilePart("/foo").should.eql("/");
			utils.reduceFilePart("/foo.md").should.eql("/");
    });

	  it('should return /foo/', function(){
			utils.reduceFilePart("/foo/bar").should.eql("/foo/");
			utils.reduceFilePart("/foo/baz").should.eql("/foo/");
	  });

    it('should return /foo/bar/', function(){
  		utils.reduceFilePart("/foo/bar/").should.eql("/foo/bar/");
  		utils.reduceFilePart("/foo/bar/baz").should.eql("/foo/bar/");
    });
  });

  // Returns the file extension
 	describe('#getExtension()', function(){
    it('should return the file extension', function(){
			(function(){ utils.getExtension(undefined); }).should.throw();
			utils.getExtension("foo.md").should.eql("md");
			utils.getExtension("/bar/foo.md").should.eql("md");
    });
  });

 	describe('#removeExtension()', function(){
    it('should return the file extension', function(){
			(function(){ utils.removeExtension(undefined); }).should.throw();
			utils.removeExtension("foo.md").should.eql("foo");
			utils.removeExtension("/bar/foo.md").should.eql("/bar/foo");
    });
  });

 	// Given a filePart return what looks like a key
 	describe('#normaizeFilePart()', function(){
    it('should normaizeFilePart', function(){
			utils.normaizeFilePart("/foo.md").should.eql("foo");
			utils.normaizeFilePart("foo.md").should.eql("foo");
			utils.normaizeFilePart("/bar/foo.md").should.eql("foo");
			utils.normaizeFilePart("/bar/foo/baz.md").should.eql("baz");
    });
  });

	// Convert a filePart into filename with extension
 	describe('#normaizeFilePartExt()', function(){
    it('should normaizeFilePart and keep the file extension', function(){
			utils.normaizeFilePartExt("/foo.md").should.eql("foo.md");
			utils.normaizeFilePartExt("foo.md").should.eql("foo.md");
			utils.normaizeFilePartExt("/bar/foo.md").should.eql("foo.md");
			utils.normaizeFilePartExt("/bar/foo/baz.md").should.eql("baz.md");
    });
  });


 	describe('#filterEditableSync()', function(){
    it('should filterEditableSync Remove unwanted items', function(){
    	var files = ["/test.mdx", "/test.exe", "/.git/README.md","/js/main.js","/css/style.css", "readme.md"]
			utils.filterEditableSync(files).should.eql(['readme.md']);
    });
  });
  

});