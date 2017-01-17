/**
 * Link to helper
 *
 * usage:
     {{#link-to 'routeName' class="btn btn-default"}}Text inside the link{{/link-to}}
 */
var hbs = require('hbs');

module.exports = function(we) {
  return function linkTo(name) {
    const options = arguments[arguments.length-1];

    let href = '',
      route = {};

    if (we.router.routeMap.get[name]) {
      route = we.router.routeMap.get[name];
      let mapI = 1;
      for (let i = 0; i < route.map.length; i++) {
        // skip empty path parts linke  // and fist /
        if (!route.map[i]) continue;
        if (typeof route.map[i] == 'string') {
          href += '/' + route.map[i];
        } else if (arguments[mapI]){
          href += '/' + arguments[mapI];
          mapI++;
        } else {
          we.log.warn('Invalid or undefined argument: ' + arguments[i-1] +' ', route.map[i]);
        }
      }
    } else {
      we.log.warn('Route map not found: ' + name);
    }

    if (route.map && route.map.length && !href) href = '/';


    // suport to route alias
    if (we.router.alias) href = we.router.alias.resolvePath(href);

    const attributes = we.utils.helper.parseAttributes(options);

    let l = '<a href="' + href + '" ' + attributes + ' >';
      l += options.fn(this);
    l += '</a>';

    return new hbs.SafeString(l);
  };
};