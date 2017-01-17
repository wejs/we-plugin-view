/**
 * wejs view feature
 */
const hbs = require('hbs'),
  fs = require('fs');

let _;

const View = function viewPrototype(we) {
  this.we = we;
  _ = we.utils._;

  we.hbs = hbs;

  this.assets = require('./assets');
  // admin and app theme if avaible
  this.appTheme = null;
  this.adminTheme = null;
  // enabled themes list
  this.themes = {};

  // --forms feature
  this.forms = {};

  this.layoutCache = {};
  this.templateCache = {};

  this.configuration = {
    layouts: {},
    templates: {},
    helpers: {}
  };
};

/**
 * Initialize we.view feature
 * @param  {Object} we we.js
 */
View.prototype = {
  initialize(we) {
    this.getWe = function getWe(){ return we; };
    const view = this;

    // set view middleware for every request
    we.events.on('router:before:set:controller:middleware', (data)=> {
      data.middlewares.push(view.middleware.bind(data.config));
    });

    // set default themes vars
    we.events.on('we:after:load:plugins', (we)=> {
      const themesConfig = we.config.themes;
      let name;

      // load all themes
      for (let i = 0; i < themesConfig.enabled.length; i++) {
        if (we.utils._.isString(themesConfig.enabled[i])) {
          name = themesConfig.enabled[i];

          view.themes[name] = new we.class.Theme(
            name, we.projectPath
          );
        } else {
          name = themesConfig.enabled[i].name;

          view.themes[name] = new we.class.Theme(
            name, we.projectPath, themesConfig.enabled[i]
          );
        }

        view.themes[name].projectThemeName = name;
      }

      view.appTheme = themesConfig.app;
      view.adminTheme = themesConfig.admin;
    });

    // change default missing helper log
    we.hbs.handlebars.helpers.helperMissing = view.helperMissing;
  },

  /**
   * Load templates from cache file?
   *
   * @return {Boolean}
   */
  loadFromCache() {
    return this.we.config.loadTemplatesFromCache[this.we.env];
  },

  setExpressConfig(express) {
    const view = this;

    express.use(function viewConfigMiddleware(req, res, next) {
      res.renderPage = view.renderPage.bind({req: req, res: res});
      // default theme, is changed if are in admin area
      res.locals.theme = view.appTheme;
      // theme object getter
      res.getTheme = view.geTheme;

      // set default htmlTemplate file
      res.locals.htmlTemplate = 'html';

      if (req.query.skipHTML) res.locals.skipHTML = true;

      next();
    });
  },

  geTheme() {
    return this.req.we.view.themes[this.locals.theme];
  },

  middleware(req, res, next) {
    const we = req.we;

    we.view.resolveLayout(req, res, ()=> {
      // set default layout name
      if (!res.locals.layoutName) res.locals.layoutName = 'default';

      if (res.locals.skipWidgets) return next();
      // only work with html requests
      if (!req.accepts('html') || req.query.contentOnly) return next();

      // set response layout regions
      if (!res.locals.regions) res.locals.regions = {};

      const theme = res.getTheme();

      if (theme) {
        if (!theme.layouts[res.locals.layoutName]) {
          res.locals.layoutName = 'default';
        }
      }

      we.hooks.trigger('request:view:after:resolve:layout', {
        req: req, res: res
      }, next);
    });
  },

  registerAll() {
    this.registerHelpers(this.we);
    const themes = this.we.view.themes;

    // move all templates to we.view.configuration.templates
    let name, templateName;

    for (name in themes) {
      // skip if this theme dont have templates
      if (!themes[name].templates) continue;
      // for each template in theme ...
      for (templateName in themes[name].templates) {
        // add it in configuration.templates
        this.we.view.configuration.templates[name+'/'+templateName] = themes[name].templates[templateName];
      }
    }
  },

  registerHelpers(we) {
    for (let helperName in this.configuration.helpers) {
       hbs.registerHelper( helperName, require( this.configuration.helpers[helperName] )(we, this) );
    }
  },

  renderLayout(req, res, data) {
    const view = req.we.view,
      theme = res.getTheme();

    let template;

    // render body afer render layout
    res.locals.body = view.renderBody(res);
    // unique name for current theme layout
    let layoutThemeName = res.locals.theme + '/' + res.locals.layoutName;

    if (view.loadFromCache()) {
      // load template from cache, by defalt only load for prod env
      template = view.layoutCache[layoutThemeName];
    } else {
      if (theme && theme.layouts[res.locals.layoutName]) {
        template = hbs.compile(fs.readFileSync(theme.layouts[res.locals.layoutName].template, 'utf8'));
      } else if (view.configuration.layouts[res.locals.layoutName]){
        template = hbs.compile(fs.readFileSync(view.configuration.layouts[res.locals.layoutName], 'utf8'));
      } else {
        template = hbs.compile(fs.readFileSync(view.configuration.layouts.default, 'utf8'));
      }
    }

    if (data) res.locals.data = data;
    if (res.locals.skipHTML) {
      return template(res.locals);
    } else if (template) {
      res.locals.layoutHtml = '<div id="we-layout" data-we-layout="'+
        res.locals.layoutName+'" data-we-widgetcontext="'+
        (res.locals.widgetContext || '')+'" >' +
        template(res.locals) +
      '</div>';
      return view.renderTemplate(res.locals.htmlTemplate, res.locals.theme, res.locals);
    } else {
      req.we.log.warn('Layout template not found: '+layoutThemeName);
      return '';
    }
  },

  /**
   * Render html body content
   * @param  {Object} res express response
   * @return {String}     html
   */
  renderBody(res) {
    return this.renderTemplate(res.locals.template, res.locals.theme, res.locals);
  },

  /**
   * render one template, first check if the template exists in theme if now fallback to plugin tempalte
   * @param  {String} name      template name
   * @param  {String} themeName current theme name
   * @param  {Object} data      Data to send to template
   * @return {String}           compiled template html
   */
  renderTemplate(name, themeName, data) {
    const view = this,
      theme = view.themes[themeName];

    let template;

    // unique name for current theme template
    let templateThemeName = themeName + '/' + name;

    // check in theme cache if load from cache is set in configs, by default will load in prod env
    if (view.loadFromCache()) {
      if (view.templateCache[templateThemeName]) {
        // theme template
        return view.templateCache[templateThemeName](data);
      } else if (view.templateCache[name]) {
        // plugin template
        return view.templateCache[name](data);
      }
    }

    // resolve template and get it compiled
    template = View.prototype.getAndCompileTemplateToRenderSync(theme, view, templateThemeName, data, name);

    // template not found
    if (!template) {
      this.we.log.error('Template not found: ' + name + ' themeName: ' + themeName);
      return '';
    }

    // save in cache if not found ... this may ocurs for templates with fallback
    if (view.loadFromCache()) {
      // cache it if are prod env
      view.templateCache[templateThemeName] = template;
    }

    try {
      return template(data);
    } catch(e) {
      this.we.log.error('Error on render template: ',name, template, e);
      return '';
    }
  },

  /**
   * Get and compile templates from view templates configurations  or from data.fallbackTemplate
   */
  getAndCompileTemplateToRenderSync(theme, view, templateThemeName, data, name) {

    if (theme && view.configuration.templates[templateThemeName]) {
      // theme template
      return hbs.compile(fs.readFileSync(view.configuration.templates[templateThemeName], 'utf8'));
    } else if (view.configuration.templates[name]) {
      // plugin template
      return hbs.compile(fs.readFileSync(view.configuration.templates[name], 'utf8'));
    } else if (data && data.fallbackTemplate) {
      // fallback template
      return hbs.compile(fs.readFileSync(data.fallbackTemplate, 'utf8'));
    } else {
      return null;
    }
  },

  renderPage(req, res, data) {
    return req.we.view.renderLayout(req, res, data);
  },

  themeScriptTag(src) {
    return '<script type="text/javascript" src="'+ src+this.assets.v+'"></script>';
  },

  themeStylesheetTag(href) {
    return '<link href="'+ href+this.assets.v+'" rel="stylesheet" type="text/css">'
  },

  /**
   * Resolve layout for current request
   *
   * @param  {Object}   req  express.js request
   * @param  {Object}   res  express.js response
   * @param  {Function} next callback
   */
  resolveLayout(req, res, next) {
    const theme = res.getTheme();

    if (!theme) return next();

    if (!res.locals.layoutName || res.locals.layoutName === 'default') {
      // first try to use the controller + - + modelName + -layout
      if (
        res.locals.controller &&
        res.locals.model &&
        theme.layouts[res.locals.controller+ '-' +res.locals.model+'-layout']
      ) {
        res.locals.layoutName = res.locals.controller+ '-' +res.locals.model+'-layout';

      // then use res.locals.model+'-layout'
      } else if (res.locals.model && theme.layouts && theme.layouts[res.locals.model+'-layout']) {
        res.locals.layoutName = res.locals.model+'-layout';
      // or set the default layout
      } else {
        res.locals.layoutName = 'default';
      }
    }

    next();
  },

  helperMissing() {
    if (!this.we && !this.locals) return; // skip if not found we

    let we = this.we || this.locals.req.we;

    if (arguments.length > 1 || !_.isEmpty(arguments[0].hash) ) {
      if (we.env == 'prod') {
        we.log.verbose('Missing helper: ', arguments[arguments.length - 1].name);
      } else {
        we.log.warn('Missing helper: ', arguments[arguments.length - 1].name);
      }
    }
  },

  loadTemplatesFromCacheBuild(we, cb) {
    let cache, name;

    try {
      cache = require(we.config.templatesCacheFile)(we);
    } catch (e){
      we.log.error('we.config.loadTemplatesFromCache.'+we.env+'=true is set.');
      we.log.error(
        'Templates cache file not found, try to run "npm run build" command for generate the template cache file:',
        we.config.templatesCacheFile
      );

      process.exit();
    }

    // compile and load all layouts
    for (name in cache.layouts) {
      we.view.layoutCache[name] = we.hbs.compile(cache.layouts[name], 'utf8');
    }

    // compile and load all templates
    for (name in cache.templates) {
      we.view.templateCache[name] = we.hbs.compile(cache.templates[name], 'utf8');
    }

    cb();
  },

  cacheAllTemplates(we, cb) {
    if (!cb) cb = function(){};

    const cache = {
      layouts: {},
      templates: {}
    },
    themes = we.view.themes,
    themeNames = Object.keys(themes);

    we.utils.async.series([
      function loadAll (done){

        we.utils.async.each(themeNames, function eachTheme(themeName, next){
          const theme = themes[themeName];

          // layouts
          for (let layoutName in theme.layouts) {
            cache.layouts[themeName+'/'+layoutName] = fs.readFileSync(theme.layouts[layoutName].template, 'utf8');
          }

          // templates

          for (let templateName in we.view.configuration.templates) {
            // load the template
            cache.templates[templateName] = fs.readFileSync(we.view.configuration.templates[templateName], 'utf8');
          }

          next();
        }, done);
      }

    ], function doneAll(err) {
      if (err) return cb(err);

      let text = 'module.exports = function loadCachedTemplates (we){\n';
      text += 'return '+ JSON.stringify(cache, null, 2) + '\n';
      text += '\n};';

      fs.writeFile(we.config.templatesCacheFile, text, function afterSaveFile(err){
        if (err) return cb(err);

        cb();
      });
    });
  }
};

module.exports = View;
