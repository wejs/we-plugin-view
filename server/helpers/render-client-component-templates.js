/**
 * Print we.js client side core configs
 *
 * usage: {{{render-client-component-templates}}}
 *
 */
const hbs = require('hbs');

module.exports = function(we) {
  return function renderClientComponentTemplates() {
    let html = '<div class="we-components-area">';

    for (let t in we.config.clientComponentTemplates) {
      if (!we.config.clientComponentTemplates[t]) continue;

      html += we.view.renderTemplate(t, this.theme, this);
    }

    html += '</div>';

    return new hbs.SafeString(html);
  };
};