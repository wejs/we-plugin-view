/**
 * Script to check if have update avaible for all themes
 */

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
      we.view.verifyAllThemesUpdate(we, doneAll);
    });

  });

  function doneAll(err) {
    if (err) {
      we.log.error('VTU:Done with error', err);
    }

    we.exit(process.exit);
  }
};
