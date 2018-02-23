const request = require('request');

module.exports = {
  /**
   * Verify if all themes have update avaible
   *
   * @param  {Object}   we  We.js instance
   * @param  {Function} cb  Callback
   */
  verifyAllThemesUpdate(we, cb) {
    let themes = {};

    const themeNames = Object.keys(we.view.themes);
    // no themes installed to verify updates:
    if (!themeNames.length) return cb();

    themeNames.forEach( (name)=> {
      themes[name] = we.view.themes[name].version;
    });

    request.post({
      url: we.config.themeUpdateURL,
      json: { themes: themes }
    },
    function (err, httpResponse, body) {
      if (err) return cb(err);

      let themesToUpdate = null;

      if (body && body.haveUpdate && Object.keys(body.haveUpdate).length ) {
        themesToUpdate = JSON.stringify(body.haveUpdate);
      }

      we.plugins['we-plugin-db-system-settings']
      .setConfigs({
        themesToUpdate: themesToUpdate
      }, cb);
    });
  },

  /**
   * Verify one theme update
   *
   * @param  {Object}   we   We.js instance
   * @param  {String}   name Theme name
   * @param  {Function} cb   Callback
   */
  verifyThemeUpdate(we, name, cb) {
    if (!we.view.themes[name]) return cb();

    request.post({
      url: we.config.themeUpdateURL,
      json: {
        themes: {
          [name]: we.view.themes[name].version
        }
      }
    },
    function (err, httpResponse, body) {
      if (err) return cb(err);

      let themesToUpdate = null;

      if (body && body.haveUpdate && Object.keys(body.haveUpdate).length ) {
        themesToUpdate = JSON.stringify(body.haveUpdate);
      }

      we.plugins['we-plugin-db-system-settings']
      .setConfigs({
        themesToUpdate: themesToUpdate
      }, cb);
    });
  }
};