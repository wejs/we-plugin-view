/**
 * Render a we.js record teaser
 *
 * usage: {{render-record-teaser modelName='article' record=record locals=locals}}
 */

module.exports = function(we) {
  return function renderRecordTeaser() {
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
      we.log.verbose('we-plugin-view:helper:render-record-teaser:locals not found');
      return '';
    }

    let theme = (opts.hash.theme || ctx.theme);

    if (
      !opts.hash.record ||
      !ctx ||
      !opts.hash.modelName
    ) return '';

    return new we.hbs.SafeString(we.view.renderTemplate(
      opts.hash.modelName + '/teaser',
      theme,
      {
        modelName: opts.hash.modelName,
        record: opts.hash.record,
        locals: ctx
      }
    ));
  };
};