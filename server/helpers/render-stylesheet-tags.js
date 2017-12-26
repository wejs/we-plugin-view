/**
 * Render theme stylesheet
 *
 * usage: {{{render-stylesheet-tags}}}
 */

module.exports = function(we, view) {
  return function renderStylesheetTags(location) {
    let tags = '';

    if (!location || (typeof location != 'string') ) {
      location = 'header';
    }

    if (we.env === 'prod' && !we.config.skipCompiledCSSFile) {
      tags += view.assets.themeStylesheetTag(
        '/public/project/build/prod.'+location+'.css'
      );
    } else {
      tags += view.assets.getAssetsHTML('css', location);
    }

    if (location == 'header') {
        // render theme assets
      let files = [];
      const tst = view.getThemeStyle(we, this.theme, view, this);

      files.push('/public/theme/'+ view.themes[this.theme].name+tst);

      for (let i = 0; i < files.length; i++) {
        tags = tags + view.themeStylesheetTag(files[i]);
      }
    }

    return tags;
  };
};