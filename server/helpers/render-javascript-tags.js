/**
 *  Render project javascript tags
 *
 * {{{render-javascript-tags}}}
 */

module.exports = function(we) {
  return function renderJavascriptTags(location) {
    var tags = '';

    if (!location || typeof location !== 'string') {
      location = 'footer';
    }

    if (we.env === 'prod' && !we.config.skipCompiledJSFile) {
      tags += we.view.assets.themeScriptTag(
        '/public/project/build/prod.'+location+'.js'
      );
    } else {
      tags += we.view.assets.getAssetsHTML('js', location);
    }

    if (location == 'footer') {
        // render theme assets
      var files = [];
      files.push(
        '/public/theme/'+ we.view.themes[this.theme].name + we.view.themes[this.theme].configs.javascript
        .replace('files/public', '')
      );

      // render core assets locatization files based in current locale
      if (this.locale && this.locale.substr(0,2) !== 'en') {
        files.push('/public/plugin/we-plugin-view/files/vendor/select2/dist/js/i18n/'+this.locale+'.js');
        files.push('/public/plugin/we-plugin-view/files/vendor/jquery.validate/dist/localization/messages_'+this.locale+'.js');
        files.push('/public/plugin/we-plugin-view/files/vendor/jquery-ui/i18n/datepicker-'+this.locale+'.js');
      }

      we.events.emit('render-javascript-tags:before:render', {
        we: we, files: files, location: location, context: this
      });

      for (var i = 0; i < files.length; i++) {
        tags = tags + we.view.themeScriptTag(files[i]);
      }
    }

    return tags;
  }
}