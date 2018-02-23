/**
 *  Render project javascript tags
 *
 * {{{render-javascript-tags}}}
 */

module.exports = function(we, view) {
  return function renderJavascriptTags(location) {
    let tags = '';
    /* theme version */
    let tv = '';
    if (view.themes[this.theme]) {
      tv = '&tv='+view.themes[this.theme].version;
    }

    if (!location || typeof location !== 'string') {
      location = 'footer';
    }

    if (we.env === 'prod' && !we.config.skipCompiledJSFile) {
      tags += view.assets.themeScriptTag(
        '/public/project/build/prod.'+location+'.js', tv
      );
    } else {
      tags += view.assets.getAssetsHTML('js', location);
    }

    if (location == 'footer') {
        // render theme assets
      let files = [];
      files.push(
        '/public/theme/'+ view.themes[this.theme].name + view.themes[this.theme].configs.javascript
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

      for (let i = 0; i < files.length; i++) {
        tags = tags + view.themeScriptTag(files[i], tv);
      }
    }

    return tags;
  };
};