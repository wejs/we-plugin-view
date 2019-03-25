/**
 * wejs view feature
 */
const hbs = require('hbs'),
  StreamZip = require('node-stream-zip'),
  path = require('path'),
  fs = require('fs'),
  request = require('request');

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

  this.systemSettingsActiveThemes = null;

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
  update: require('./update/index.js'),

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
    });

    we.hooks.on('we:after:load:plugins', (we, done)=> {
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

      // init themes not auto loaded:
      we.utils.async.eachOf(view.themes, (t, k, next)=> {
        if (!t.init) return next();
        t.init(next);
      }, done);
    });

    we.hooks.on('system-settings:started', (we, done)=> {
      this.autoloadThemes(we, done);
    });

    we.hooks.on('system-settings:started', (we, done)=> {
      we.view.registerAll();
      done();
    });

    // change default missing helper log
    we.hbs.handlebars.helpers.helperMissing = view.helperMissing;
  },

  autoloadThemes(we, done) {
    const view = this;

    if (!we.config.themeAutoloadFolder || !we.systemSettings) {
      return done();
    }

    we.utils.mkdirp(we.config.themeAutoloadFolder, (err)=> {
      if (err) return done(err);

      fs.readdir(we.config.themeAutoloadFolder, (err, files) => {
        if (err) return done(err);

        we.utils.async.each(files, (name, next)=> {
          this.loadTheme(name, next);
        }, (err)=> {
          if (err) return done(err);

          if (view.themes[we.systemSettings.siteTheme]) {
            view.appTheme = we.systemSettings.siteTheme;
          }

          // if have themes and not appTheme, set the first theme
          if (!view.appTheme) {
            const themeNames = Object.keys(view.themes);
            if (themeNames && themeNames.length) {
              view.appTheme = view.themes[themeNames[0]].name;
            }
          }

          view.systemSettingsActiveThemes = we.systemSettings.activeThemes;

          done();
        });
      });
    });
  },

  loadTheme(name, done) {
    let themeFolder = path.join(this.we.config.themeAutoloadFolder, name);

    this.themes[name] = new this.we.class.Theme(
      name, this.we.projectPath, { name: name, themeFolder: themeFolder }
    );

    this.themes[name].init(done);
  },

  moveWidgetsToTheme(oldThemeName, newThemeName, cb) {
    if (!this.we.db.models.widget) return cb();

    this.we.db.models.widget.update (
      { theme: newThemeName },
      { where: { theme: oldThemeName } }
    )
    .then( ()=> {
      cb();
      return null;
    })
    .catch( (err)=> {
      cb(err);
      return null;
    });
  },

  downloadAndInstallTheme(name, release, cb) {
    const we = this.we;

    this.downloadTheme(name, release, (err)=> {
      if (err) return cb(err);
      // re register and override all themes:
      this.loadTheme(name, (err)=> {
        if (err) return cb(err);

        this.registerAll();

        const folder = path.join(we.config.themeAutoloadFolder, name);
        this.setThemePublicFolderRoute(name, folder);

        this.enableTheme(name, cb);
      });
    });
  },

  enableTheme(name, cb) {
    const oldThemeName = this.appTheme;

    this.moveWidgetsToTheme(oldThemeName, name, (err)=> {
      if (err) return cb(err);
      this.appTheme = name;
      cb();
    });
  },

  isThemeInstalled(name) {
    if (this.themes[name]) {
      // installed
      return true;
    }
  },

  downloadTheme(name, release, cb) {
    const we = this.we;

    let destPath = path.join(we.config.themeAutoloadFolder, name);
    let destFile = destPath+'.zip';
    const dest = fs.createWriteStream( destFile );

    const r = request.get(release);
    r.on('error', function(err) {
      fs.unlink( destFile );
      return cb(err);
    });

    let stream = r.pipe(dest);

    stream.on('finish', ()=> {
      dest.close( ()=> {
        this.extractTheme( destFile, destPath, ()=> {
          fs.unlink( destFile, cb);
        });
      });
    });
  },

  setThemePublicFolderRoute(name, folder) {
    const we = this.we;

    const cfg = { maxAge: we.config.cache.maxage };

    this.we.router.publicRouter.use(
      '/theme/' + name,
      we.utils.express.static(path.join(
        folder, 'files/public'
      ), cfg)
    );
  },

  extractTheme(zipFile, dest, cb) {
    const we = this.we;

    const zip = new StreamZip({
      file: zipFile,
      storeEntries: true
    });

    zip.on('ready', () => {
      we.utils.mkdirp(dest, (err)=> {
        if (err) return cb(err);
        zip.extract(null, dest, (err, count) => {
          zip.close();
          cb(err, count);
        });
      });

    });
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
    const view = req.we.view;

    // unique name for current theme layout
    let layoutThemeName = res.locals.theme + '/' + res.locals.layoutName;

    let template = this.getLayoutTemplate(req, res, layoutThemeName);

    // render body afer render layout
    res.locals.body = view.renderBody(res);

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
   * Get layout theme template
   *
   * @param  {Object} req              Express.js request
   * @param  {Object} res              Express.js response
   * @param  {String} layoutThemeName  Layout name
   * @return {String|null}             Returns the template or null
   */
  getLayoutTemplate(req, res, layoutThemeName) {
    const view = req.we.view,
      theme = res.getTheme();

    if (view.layoutCache[layoutThemeName]) {
      // Load template from cache:
      return view.layoutCache[layoutThemeName];
    } else {
      // Theme template
      if (theme && theme.layouts[res.locals.layoutName]) {
        let template = hbs.compile(fs.readFileSync(theme.layouts[res.locals.layoutName].template, 'utf8'));
        // If cache is active, cache the template:
        if (view.loadFromCache()) {
          view.layoutCache[layoutThemeName] = template;
        }

        return template;
      }

      if (view.configuration.layouts[res.locals.layoutName]) {
        // layout get from plugins:
        return hbs.compile(fs.readFileSync(view.configuration.layouts[res.locals.layoutName], 'utf8'));
      }
      // default we.js core layout:
      return hbs.compile(fs.readFileSync(view.configuration.layouts.default, 'utf8'));
    }
    // template not found:
    return null;
  },

  /**
   * Render html body content
   *
   * @param  {Object} res express response
   * @return {String}     html
   */
  renderBody(res) {
    return this.renderTemplate(res.locals.template, res.locals.theme, res.locals);
  },

  /**
   * Render one template
   * First check if the template exists in theme else fallback to plugin template
   *
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
    if (view.templateCache[templateThemeName]) {
      // cached theme template:
      return view.templateCache[templateThemeName](data);
    }

    // resolve template and get it compiled
    template = view.getAndCompileTemplateToRenderSync(theme, templateThemeName, data, name);

    // template not found
    if (!template) {
      this.we.log.error('Template not found:', {
        name,
        themeName,
        templateThemeName
      });
      return '';
    }

    try {
      return template(data);
    } catch(e) {
      this.we.log.error('Error on render template:', {
        name,
        template,
        e,
        data
      });
      return '';
    }
  },

  /**
   * Get and compile templates from view templates configurations  or from data.fallbackTemplate
   */
  getAndCompileTemplateToRenderSync(theme, templateThemeName, data, name) {
    const view = this;

    if (theme && view.configuration.templates[templateThemeName]) {
      // theme template
      let template = hbs.compile(fs.readFileSync(view.configuration.templates[templateThemeName], 'utf8'));

      // save in cache if not found ... this may ocurs for templates with fallback
      if (view.loadFromCache()) {
        // cache it if are prod env
        view.templateCache[templateThemeName] = template;
      }

      return template;
    } else if (view.configuration.templates[name]) {
      // plugin template
      return hbs.compile(fs.readFileSync(view.configuration.templates[name], 'utf8'));
    } else if (view.loadFromCache() && view.templateCache[name]) {
      return view.templateCache[name];
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

  themeScriptTag(src, tv) {
    if (!tv) tv = '';
    return '<script type="text/javascript" src="'+ src+ this.assets.v+tv+'"></script>';
  },

  themeStylesheetTag(href, tv) {
    if (!tv) tv = '';
    return '<link href="'+ href+this.assets.v+tv+'" rel="stylesheet" type="text/css">';
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
    // DEPRECATED!
    cb();
  },
  cacheAllTemplates(we, cb) {
    if (!cb) cb = function(){};
    we.log.warn('DEPRECATED:cacheAllTemplates: Removed for allows hot swap');
    cb();
  },
  cacheAllThemeTemplates(themeName, themes, cache, next) {
    this.we.log.warn('DEPRECATED:cacheAllThemeTemplates: Removed for allows hot swap');
    next();
  },

  getThemeStyle(we, theme, view, locals) {
    const configs = view.themes[theme].configs;

    if (configs.colors) {
      const qtc = locals.req.query.themeColorName;

      if (qtc && configs.colors[ qtc ]) {
        return configs.colors[ qtc ].stylesheet.replace('files/public', '');
      } else if (
        we.systemSettings &&
        we.systemSettings[theme+'ColorName'] &&
        configs.colors[ we.systemSettings[theme+'ColorName'] ]
      ) {
        return configs.colors[ we.systemSettings[theme+'ColorName'] ].stylesheet.replace('files/public', '');
      }
    }

    return configs.stylesheet.replace('files/public', '').replace('files/public', '');
  }
};

module.exports = View;
