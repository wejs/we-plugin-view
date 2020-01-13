/**
 * We.js metatag feature, set res.locals.metatag variable
 *
 */

/**
 * Set canocical
 * Also avaible as we.plugins['we-plugin-view'].setCanonicalURL
 *
 * @type {Function}
 */
const setCanonicalURL = require('./setCanonicalURL.js');

module.exports = {
  /**
   * add one middleware with name
   *
   * @param {String} name       Express.js middleware
   * @param {Function} middleware Express.js middleware
   */
  add(name, middleware) {
    this.middlewares[name] = middleware;
  },

  /**
   * Metadata middlware how select one  metatag middleware handler
   *
   * @param  {Object}   req  Express.js request
   * @param  {Object}   res  Express.js response
   * @param  {Function} next callback
   */
  middleware(req, res, next) {
    if (res.locals.metatagHandler) {
      if (typeof res.locals.metatagHandler === 'function') {
        return res.locals.metatagHandler(req, res, next);
      } else if (req.we.router.metatag.middlewares[res.locals.metatagHandler]) {
        return req.we.router.metatag.middlewares[res.locals.metatagHandler](req, res, next);
      }
    }
    // else use the default
    req.we.router.metatag.middlewares.default(req, res, next);
  },

  /**
   * Middleware handlers
   *
   * @type {Object}
   */
  middlewares: {

    /**
     * Default middleware
     */
    default(req, res, next) {
      const we = req.we;
      let url = req.we.config.hostname+req.urlBeforeAlias;
      let title, siteName;

      setCanonicalURL(req, res);

      if (!req.we.systemSettings) {
        // Without systemSettings feature:
         title = res.locals.title;
         siteName = res.locals.appName;
      } else {
        siteName = (req.we.systemSettings.siteName || req.we.config.appName);
        const hostname = req.we.config.hostname;

        title = res.locals.title || siteName;

        if (we.systemSettings.siteDescription) {
          const description = we.utils.stripTagsAndTruncate (
            we.systemSettings.siteDescription,
            200
          );

          res.locals.metatag += '<meta property="og:description" content="'+
            description+
          '" />';
          res.locals.metatag += '<meta content="'+description+'" name="description">';
          res.locals.metatag += '<meta content="'+description+'" name="twitter:description">';
        }

        if (we.systemSettings.ogImageUrlOriginal) {
          const imageUrl = we.systemSettings.ogImageUrlOriginal;

          res.locals.metatag +=
            '<meta property="og:image" content="'+hostname+imageUrl+'" />';
        }

        if (we.systemSettings.metatagKeywords) {
          res.locals.metatag +=
            '<meta name="keywords" content="'+we.systemSettings.metatagKeywords+'" />';
        }
      }

      res.locals.metatag +=
        '<meta property="og:url" content="'+url+'" />'+
        '<meta property="og:title" content="'+title+'" />' +
        '<meta property="og:site_name" content="'+siteName+'" />'+
        '<meta property="og:type" content="website" />';
      return next();
    },


    /**
     * User findOne action metatag middleware
     */
    userFindOne(req, res, next) {
      const hostname = req.we.config.hostname;
      const we = req.we;
      let url = we.config.hostname+req.urlBeforeAlias;
      let title, siteName;

      setCanonicalURL(req, res);

      if (!we.systemSettings) {
        title = res.locals.title;
        siteName = res.locals.appName;
      } else {
        siteName = (we.systemSettings.siteName || we.config.appName);
        title = res.locals.title || siteName;
      }

      res.locals.metatag +=
        '<meta property="og:url" content="'+url+'" />'+
        '<meta property="og:title" content="'+title+'" />' +
        '<meta property="og:site_name" content="'+siteName+'" />'+
        '<meta property="og:type" content="profile" />';

      if (res.locals.data.biography) {
        const cleanText = we.utils.stripTagsAndTruncate (
          res.locals.data.biography, 200
        );

        res.locals.metatag += '<meta property="og:description" content="'+
          cleanText+
        '" />';
      }

      if (res.locals.data.avatar && res.locals.data.avatar[0]) {
        const img = res.locals.data.avatar[0];

        res.locals.metatag +=
          '<meta property="og:image" content="'+hostname+img.urls.large+'" />'+
          '<meta property="og:image:type" content="'+img.mime+'" />'+
          '<meta property="og:image:width" content="'+img.width+'" />'+
          '<meta property="og:image:height" content="'+img.height+'" />';
      }

      next();
    }
  }
};