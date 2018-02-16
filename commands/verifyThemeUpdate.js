/**
 * Script to check if have update avaible for all themes
 */
const request = require('request');

module.exports = function (program, helpers) {
  let we;

  program
  .command('verify-theme-update')
  .alias('VTU')
  .description('Command to verify if have theme updates')
  .action( function run() {
    we = helpers.getWe();

    we.bootstrap( (err)=> {
      if (err) return doneAll(err);

      let themes = {};

      const themeNames = Object.keys(we.view.themes);

      if (!themeNames.length) return doneAll();

      themeNames.forEach( (name)=> {
        themes[name] = we.view.themes[name].version;
      });

      const url = 'https://shop.linkysystems.com/project-theme-verify-update';

      // load all themes:
      request.post({
        url: url,
        json: { themes: themes }
      },
      function (err, httpResponse, body) {
        if (err) return doneAll(err);

        let themesToUpdate = null;

        if (body && body.haveUpdate && Object.keys(body.haveUpdate).length ) {
          themesToUpdate = JSON.stringify(body.haveUpdate);
        }

        we.plugins['we-plugin-db-system-settings']
        .setConfigs({
          themesToUpdate: themesToUpdate
        }, doneAll);
      });
    });

  });

  function doneAll(err) {
    if (err) {
      we.log.error('VTU:Done with error', err);
    }

    we.exit(process.exit);
  }
};
