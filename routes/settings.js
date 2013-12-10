module.exports = function(editor) {
  return {

    /**
     * Method: GET
     * Show all the settings
     */
    get: function (req, res) {
      editor.harp.getGlobals(function(err, globals) {
        res.render('settings/get', {nav:'settings', message: req.flash('info'), globals:globals});
      });
    },

    /**
     * Method: POST
     * Update all the settings
     */
    update: function(req, res){
      editor.harp.updateGlobals(req.body, function(err, result){
        req.flash('info', 'Settings Saved');
        res.redirect("/admin/settings");  
      });
    }
  };
};