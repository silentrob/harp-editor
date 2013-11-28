var editor      = require("./editor");

var fileToTitle = function(filePart) {
  // Remove beginning slash
  var clean = filePart.replace(/\//, "");
  var ext = editor.utils.getExtension(filePart);
  clean = clean.replace("." + ext, "")
  return clean;
}

// In the event we want to pass anything in here...
exports.helpers = function(){

  return function(req, res, next) {

    res.locals.keyToTitle = function(key) {
      var key = key.replace(/_|-/g, ' ')
      return key.toLowerCase().replace(/\b[a-z]/g, function(letter) {
        return letter.toUpperCase();
      });
    }

  	res.locals.toUpperCase = function(str) {
	  	return str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
	    	return letter.toUpperCase();
			});
  	}

  	res.locals.fileToTitle = fileToTitle;

  	res.locals.fileToSlug = function(filePart) {
  		return editor.utils.normaizeFilePart(filePart)
  	}

    res.locals.reduceFilePart = function(filePart) {
      return editor.utils.reduceFilePart(filePart)
    }
    
  	res.locals.isHidden = function(str) {
  		return /_/.test(str);
  	}

  	res.locals.link = function(str) {
  		if (!str) return "";
  		// Chop off the ext and that should be served
  		var ext = editor.utils.getExtension(str);
  		return str.replace("." + ext,"")
  	}

  	res.locals.nestDepth = function(str) {
  		return (str.split("/").length - 1)
  	}

  	res.locals.getTitle = function(meta) {
      return (meta && meta.title) ? meta.title : "";
  	}

  	res.locals.getLayout = function(meta) {
  		if (meta.layout === false) {
  			return "none";
  		} else {
  			return "_layout";
  		}
  	}

    res.locals.listTitle = function(slug, obj) {
      return (obj.title)? obj.title : fileToTitle(slug)
    }

    res.locals.memberDisplayName = function(obj) {
      return (obj.first_name && obj.last_name) 
        ? obj.first_name + " " + obj.last_name : obj.username;
    }
  

  	next();
  }
}