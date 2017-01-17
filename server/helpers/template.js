/**
 *  Render one template
 *
 * {{{template 'templateHName' locals=this}}}
 */

module.exports = function(we) {
  return function rendertemplate(name) {
    const opts = arguments[arguments.length-1];
    let ctx;
    // find context to get theme name
    if (opts.hash && opts.hash.locals) {
      ctx = opts.hash.locals;
    } else if (this.theme) {
      ctx = this;
    } else if (this.locals && this.locals.theme) {
      ctx = this.locals;
    } else {
      we.log.verbose('we-plugin-view:helper:locals not found');
      return '';
    }
    let theme = (opts.hash.theme || ctx.theme);
    // if not find the theme name get default themes
    if (!theme) theme = we.view.themes[we.view.appTheme];
    // render the template
    return new we.hbs.SafeString(we.view.renderTemplate(name, theme, ctx));
  };
};