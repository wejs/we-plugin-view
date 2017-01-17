module.exports = {
  install(we, done) {
    if (we.config.themes && we.config.themes.enabled && we.config.themes.enabled.length) {
      return done();
    }

    we.log.warn(
      'No theme found, add one theme with commands\n'+
      'we i we-theme-cluster we-plugin-bootstrap3\n'+
      'we vset themes.enabled[0] we-theme-cluster\n'+
      'we vset themes.app we-theme-cluster'
    );

    done();
  }
};