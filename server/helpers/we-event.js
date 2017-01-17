/**
 * We.js template event, allow add html with events
 *
 * usage:  {{we-event event="we-html-body-start"}}
 */
module.exports = function(we) {
  return function eventHelper() {
    const opts = arguments[arguments.length-1];

    if (!opts.hash.event) return '';

    let html = { text: '' } ;

    we.events.emit(opts.hash.event, {
      we: we, html: html, options: opts
    });

    return new we.hbs.SafeString(html.text);
  };
};