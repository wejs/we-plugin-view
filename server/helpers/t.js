/**
 * String localization with node i18n
 *
 * usage:  {{t 'string' attr1='val1' attr2='val2'}}
 *
 * @return {string}
 */
module.exports = function(we) {
  return function tHelper(string) {
    var options = arguments[arguments.length-1];
    var attr, __;

    if (arguments.length == 3) attr = arguments[1];

    // get express locals
    if (options.hash && options.hash.locals) {
      __ = options.hash.locals.__;
    } else if (this.__) {
      __ = this.__;
    } else if (this.locals && this.locals.__) {
      __ = this.locals.__;
    } else if (options.data.root.locals && options.data.root.locals.__) {
      __ = options.data.root.locals.__;
    } else {
        we.log.verbose('helper:t: this.__ not found, i will use we.i18n__')
      __ = we.i18n.__;
    }

    if (!string) return '';
    if (we.utils._.isString(string)) {
      return __(string.toString(), options.hash);
    } else {
      return __(string[attr], options.hash);
    }
  }
}