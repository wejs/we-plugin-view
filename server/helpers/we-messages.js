/**
 * We messages helper
 *
 * render all messages form current user locals
 *
 * usage:  {{we-messages}}
 */

module.exports = function(we) {
  return function weMessagesHelper() {
    const options = arguments[arguments.length-1],
      locals = options.data.root;

    let messages = locals.req.res.getMessages(),
      theme = (locals.theme || we.view.appTheme);

    // skip rendering if dont have messages
    if (!messages || !messages.length) return '';

    return new we.hbs.SafeString(we.view.renderTemplate('messages', theme, {
      messages: messages
    }));
  };
};