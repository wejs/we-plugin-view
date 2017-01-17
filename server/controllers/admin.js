module.exports = {
  /**
   * Index page route /
   */
  index(req, res) {
    res.locals.template = 'home/index';
    res.ok();
  },

  findThemes(req, res) {
    const we = req.we;

    res.locals.themes = we.view.themes;
    res.locals.themeConfigs = we.config.themes;

    res.ok();
  }
};