/**
 * We date formater helper
 *
 * usage:  {{we-date date format locals=locals}}
 */

module.exports = function(we) {
  const moment = we.utils.moment;

  return function datehelper(date, format) {
    if (!date) return '';
    const options = arguments[arguments.length-1];

    let d = moment(date);
    if (!d.isValid()) return '';

    let req;

    if (options.hash && options.hash.locals) {
      req = options.hash.locals.req;
    } else if (options.data.root.req) {
      req = options.data.root.req;
    } else {
      req = options.data.root.locals.req;
    }

    if (req && req.user) d.locale(req.user.language);

    if (format && typeof format === 'string') {
      return d.format(format);
    } else {
      return d.format(we.config.date.defaultFormat);
    }
  };
};