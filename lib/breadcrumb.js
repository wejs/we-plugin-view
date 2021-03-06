/**
 * Breadcrumb handlers
 */

module.exports = {
  /**
   * add one bredcrumb middleware with name
   *
   * @param {String} name       Express.js middleware
   * @param {Function} middleware Express.js middleware
   */
  add(name, middleware) {
    this.middlewares[name] = middleware;
  },

  /**
   * Middleware for select the breadcrumb middleware handler
   */
  middleware(req, res, next) {
    if (res.locals.breadcrumbHandler) {
      if (typeof res.locals.breadcrumbHandler === 'function') {
        return res.locals.breadcrumbHandler(req, res, next);
      } else if (req.we.router.breadcrumb.middlewares[res.locals.breadcrumbHandler]) {
        return req.we.router.breadcrumb.middlewares[res.locals.breadcrumbHandler](req, res, next);
      }
    }

    next();
  },

  /**
   * Middleware handlers
   *
   * @type {Object}
   */
  middlewares: {
    /**
     * Default create breadcrumb function
     * @return {Array} Links array with href and text
     */
    create(req, res, next) {
      res.locals.breadcrumb =
        '<ol class="breadcrumb">'+
          '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
          '<li><a href="'+
            req.we.router.urlTo(res.locals.resourceName + '.find', req.paramsArray)+
          '">'+res.locals.__(res.locals.resourceName + '.find')+'</a></li>'+
          '<li class="active">'+res.locals.__(res.locals.resourceName + '.create')+'</li>'+
        '</ol>';

      next();
    },

    /**
     * Default find breadcrumb function
     * @return {Array} Links array with href and text
     */
    find(req, res, next) {
      res.locals.breadcrumb =
        '<ol class="breadcrumb">'+
          '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
          '<li class="active">'+res.locals.__(res.locals.resourceName + '.find')+'</li>'+
        '</ol>';

      next();
    },

    /**
     * Default findOne breadcrumb function
     * @return {Array} Links array with href and text
     */
    findOne(req, res, next) {
      const we = req.we;
      const breadText = we.utils.stripTagsAndTruncate(res.locals.title || '', 25);

      res.locals.breadcrumb =
        '<ol class="breadcrumb">'+
          '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
          '<li><a href="'+
            we.router.urlTo(res.locals.resourceName + '.find', req.paramsArray)+
          '">'+res.locals.__(res.locals.resourceName + '.find')+'</a></li>'+
          '<li class="active">' + breadText + '</li>'+
        '</ol>';

      next();
    },

    /**
     * Default edit / update breadcrumb function
     * @return {Array} Links array with href and text
     */
    edit(req, res, next) {
      if (!res.locals.data) return next();
      const we = req.we;
      const breadText = we.utils.stripTagsAndTruncate(res.locals.title || '', 25);

      res.locals.breadcrumb =
        '<ol class="breadcrumb">'+
          '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
          '<li><a href="'+
            we.router.urlTo(res.locals.resourceName + '.find', req.paramsArray)+
          '">'+res.locals.__(res.locals.resourceName + '.find')+'</a></li>'+
          '<li><a href="'+res.locals.data.getUrlPathAlias()+'">'+
            breadText+
          '</a></li>'+
          '<li class="active">'+res.locals.__('edit')+'</li>'+
        '</ol>';

      next();
    },

    /**
     * Default delete breadcrumb function
     * @return {Array} Links array with href and text
     */
    delete(req, res, next) {
      if (!res.locals.data) return next();
      const we = req.we;
      const breadText = we.utils.stripTagsAndTruncate(res.locals.title || '', 25);

      res.locals.breadcrumb =
        '<ol class="breadcrumb">'+
          '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
          '<li><a href="'+
            we.router.urlTo(res.locals.resourceName + '.find', req.paramsArray)+
          '">'+res.locals.__(res.locals.resourceName + '.find')+'</a></li>'+
          '<li><a href="'+res.locals.data.getUrlPathAlias()+'">'+
            breadText +
          '</a></li>'+
          '<li class="active">'+res.locals.__('delete')+'</li>'+
        '</ol>';

      next();
    },

    /**
     * Breadcrumb for /auth/x pages
     */
    auth(req, res, next) {
      res.locals.breadcrumb =
        '<ol class="breadcrumb">'+
          '<li><a href="/">'+res.locals.__('Home')+'</a></li>'+
          '<li class="active">'+(res.locals.title || '')+'</li>'+
        '</ol>';

      next();
    }
  }
};