/**
 * We grid formater helper
 *
 * usage:  {{#we-grid items=array cols=colCount}}each item html{{/we-grid}}
 */
module.exports = function(we) {
  return function gridHelper() {
    const options = arguments[arguments.length-1];
    let items = options.hash.items,
       cols = options.hash.cols || 3,
      colsPerRow = cols;
    // bootstrap col size
    const bsColSize = (parseInt(12/cols));

    if (!items) return new we.hbs.SafeString(options.inverse(this));

    let html = '', rowInit = true;

    for (let i = 0; i < items.length; i++) {
      if (rowInit) {
        html += '<div class="row we-grid-row">';
        rowInit = false;
      }

      html += '<div class="we-grid-col col col-md-'+ bsColSize +'">';
        html += options.fn(items[i]);
      html += '</div>';

      if (i == (cols-1) ) {
        cols = cols + colsPerRow;
        rowInit = true;
        html += '</div>';
      }
    }

    if (!rowInit) html += '</div>';

    return new we.hbs.SafeString(html);
  };
};