/**
 * Remove all tags from text and print it
 *
 * {{we-strip-tags text='' maxLength=170 omission='...'}}
 */

module.exports = function (we) {
  const utils = we.utils;

  return function weStripTagsHelper() {
    const options = arguments[arguments.length-1];
    if (!options.hash.text) return '';

    let text = utils.stripTagsAndTruncate (
      options.hash.text,
      options.hash.maxLength || 200,
      options.hash.omission || '...'
    );

    return text;
  };
};