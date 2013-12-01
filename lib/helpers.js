var editor      = require("./editor");


// Do we really need three?
var fileToTitle = function(filePart) {
  var clean = filePart.replace(/\//, "");
  var ext = editor.utils.getExtension(filePart);
  return clean.replace("." + ext, "");
}

var slugToTitle = function(slug) {
  var clean = slug.replace(/_|-/g, " ");
  var ext = editor.utils.getExtension(slug);
  clean = clean.replace("." + ext, "");
  return toUpperCase(clean);
}

var keyToTitle = function(key) {
  var key = key.replace(/_|-/g, ' ')
  return toUpperCase(key)
}

// Uppercase the first letter of each word.
var toUpperCase = function(str) {
  return str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
    return letter.toUpperCase();
  });
}

// In the event we want to pass anything in here...
exports.helpers = function(){

  return function(req, res, next) {
    
    res.locals.getTitle = function(meta) {
      return (meta && meta.title) ? meta.title : "";
    }

    res.locals.listTitle = function(slug, obj) {
      return (obj.title)? obj.title : slugToTitle(slug)
    }

    res.locals.slugToTitle = slugToTitle;
    res.locals.fileToTitle = fileToTitle;
    res.locals.keyToTitle = keyToTitle;

    res.locals.cc = function(nav, sec) {
      return (nav == sec) ? "active" : "";
    }

    res.locals.extension = function(str) {
      return editor.utils.getExtension(str);
    }

  	res.locals.toUpperCase = toUpperCase;
  	

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

  	res.locals.getLayout = function(meta) {
  		if (meta.layout === false) {
  			return "none";
  		} else {
  			return "_layout";
  		}
  	}

    res.locals.memberDisplayName = function(obj) {
      return (obj.first_name && obj.last_name) 
        ? obj.first_name + " " + obj.last_name : obj.username;
    }
  

  	next();
  }
}