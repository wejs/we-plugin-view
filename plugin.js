/**
 * Views and themes plugin main file
 */

const path = require('path'),
  View = require('./lib/View'),
  fs = require('fs');

module.exports = function loadPlugin(projectPath, Plugin) {
  const plugin = new Plugin(__dirname);

  plugin.tplFolder = path.resolve(__dirname, 'server/templates/');
  plugin.setCanonicalURL = require('./lib/setCanonicalURL.js');

  plugin.fastLoader = function fastLoader(we, done) {
    we.controllers.adminTheme = new we.class.Controller(require('./server/controllers/adminTheme.js'));

    done();
  };

  plugin.setConfigs({
    // // theme configs
    themes: {
      // list of all enabled themes how will be load in bootstrap
      enabled: [],
      // default app theme
      app: null,
      // default admin theme
      admin: null
    },
    themeUpdateURL: 'https://shop.linkysystems.com/project-theme-verify-update',
    themeAutoloadFolder: path.resolve(projectPath, 'server/themes'),
    clientComponentTemplates: { 'components-core': true },
    templatesCacheFile: path.resolve(projectPath, 'files/templatesCacheBuilds.js'),
    cacheThemeTemplates: false, //
    loadTemplatesFromCache: {
      prod: true, dev: false, test: false
    },
    // add html pages to resources
    resourceRoutes: {
      // pages
      createForm(we, cfg, opts) {
        // GET
        we.routes['get '+opts.rootRoute+'/create'] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            layoutName: opts.layoutName, // null = default layout
            name: opts.namePrefix + opts.name + '.create',
            action: 'create',
            controller: cfg.controller,
            model: cfg.model,
            template: opts.templateFolderPrefix + opts.name + '/create',
            fallbackTemplate: plugin.tplFolder + '/default/create.hbs',
            permission: 'create_' + opts.name,
            titleHandler: 'i18n',
            titleI18n: opts.name + '.create',
            breadcrumbHandler: 'create'
          },
          opts.create,
          we.routes['get '+opts.rootRoute+'/create'] || {}
        );
        // POST
        we.routes['post '+opts.rootRoute+'/create'] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            layoutName: opts.layoutName, // null = default layout
            action: 'create',
            controller: cfg.controller,
            model: cfg.model,
            template: opts.templateFolderPrefix + opts.name + '/create',
            fallbackTemplate: plugin.tplFolder + '/default/create.hbs',
            permission: 'create_' + opts.name,
            titleHandler: 'i18n',
            titleI18n: opts.name + '.create',
            breadcrumbHandler: 'create'
          },
          opts.create,
          we.routes['post '+opts.rootRoute+'/create'] || {}
        );
      },
      editForm(we, cfg, opts, Model) {
        // GET
        we.routes['get '+opts.itemRoute+'/edit'] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            name: opts.namePrefix + opts.name + '.edit',
            layoutName: opts.layoutName, // null = default layout
            action: 'edit',
            controller: cfg.controller,
            model: cfg.model,
            paramIdName: opts.paramIdName,
            template: opts.templateFolderPrefix + opts.name + '/edit',
            fallbackTemplate: plugin.tplFolder + '/default/edit.hbs',
            permission: 'update_' + opts.name,
            titleHandler: opts.itemTitleHandler,
            titleField: Model.options.titleField,
            titleI18n: opts.name + '.edit',
            breadcrumbHandler: 'edit'
          },
          opts.edit,
          we.routes['get '+opts.itemRoute+'/edit'] || {}
        );
        // POST
        we.routes['post '+opts.itemRoute+'/edit'] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            action: 'edit',
            layoutName: opts.layoutName, // null = default layout
            controller: cfg.controller,
            model: cfg.model,
            paramIdName: opts.paramIdName,
            template: opts.templateFolderPrefix + opts.name + '/edit',
            fallbackTemplate: plugin.tplFolder + '/default/edit.hbs',
            permission: 'update_' + opts.name,
            titleHandler: opts.itemTitleHandler,
            titleField: Model.options.titleField,
            titleI18n: opts.name + '.edit',
            breadcrumbHandler: 'edit'
          },
          opts.edit,
          we.routes['post '+opts.itemRoute+'/edit'] || {}
        );
      },
      deleteForm(we, cfg, opts, Model) {
        we.routes['get '+opts.itemRoute+'/delete'] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            name: opts.namePrefix + opts.name + '.delete',
            action: 'delete',
            layoutName: opts.layoutName, // null = default layout
            controller: cfg.controller,
            model: cfg.model,
            paramIdName: opts.paramIdName,
            template: opts.templateFolderPrefix + opts.name + '/delete',
            fallbackTemplate: plugin.tplFolder + '/default/delete.hbs',
            permission: 'delete_' + opts.name,
            titleHandler: opts.itemTitleHandler,
            titleField: Model.options.titleField,
            titleI18n: opts.name + '.delete',
            breadcrumbHandler: 'delete'
          },
          opts.delete,
          we.routes['get '+opts.itemRoute+'/delete'] || {}
        );
        // POST
        we.routes['post '+opts.itemRoute+'/delete'] = we.utils._.merge(
          {
            resourceName: opts.namePrefix+opts.name,
            action: 'delete',
            layoutName: opts.layoutName, // null = default layout
            controller: cfg.controller,
            model: cfg.model,
            paramIdName: opts.paramIdName,
            template: opts.templateFolderPrefix + opts.name + '/delete',
            fallbackTemplate:  plugin.tplFolder + '/default/delete.hbs',
            permission: 'delete_' + opts.name,
            titleHandler: opts.itemTitleHandler,
            titleField: Model.options.titleField,
            titleI18n: opts.name + '.delete',
            breadcrumbHandler: 'delete'
          },
          opts.delete,
          we.routes['post '+opts.itemRoute+'/delete'] || {}
        );
      }
    }
  });

  plugin.setRoutes({
    'get /admin/theme': {
      'titleHandler'  : 'i18n',
      'titleI18n'     : 'theme_manage',
      'name'          : 'theme_manage',
      'controller'    : 'adminTheme',
      'action'        : 'findThemes',
      'template'      : 'admin/theme/index',
      'permission'    : true, // verified in controller
    },

    'post /admin/theme/:name/install': {
      'controller'    : 'adminTheme',
      'action'        : 'installTheme',
      'permission'    : true, // verified in controller
      'responseType'      : 'json',
    },
    'post /admin/theme-verify-updates': {
      'controller'    : 'adminTheme',
      'action'        : 'verifyAllThemesUpdate',
      'permission'    : true, // verified in controller
      'responseType'      : 'json',
    },
    'post /admin/theme/:name/update': {
      'controller'    : 'adminTheme',
      'action'        : 'updateTheme',
      'permission'    : true, // verified in controller
      'responseType'  : 'json',
    },
    'get /theme': {
      controller: 'adminTheme',
      action: 'getAllThemes',
      responseType: 'json'
    }
  });

  plugin.setLayouts({
    default: __dirname + '/server/templates/default-layout.hbs',
    'user/layout': __dirname + '/server/templates/user/layout.hbs'
  });

  plugin.we.router.title = require('./lib/title');
  plugin.we.router.metatag = require('./lib/metatag');
  plugin.we.router.breadcrumb = require('./lib/breadcrumb');


  /**
   * Html response type, rende one page with layout, regions and widgets
   *
   * If req.query.contentOnly is set only render the page content
   *
   * @param  {Object} data
   * @param  {Object} req  Express.js request
   * @param  {Object} res  Express.js response
   * @return {String}      html page
   */
  plugin.htmlFormater = function htmlFormater(req, res) {
    if (req.query.contentOnly) {
      res.send(req.we.view.renderTemplate(res.locals.template, res.locals.theme, res.locals));
    } else {
      if (res && res.renderPage) {
        res.send(res.renderPage(req, res, res.locals.data));
      } else {
        // res.renderPage should be set, if not we have a unspected error
        res.status(500).send({ error: 'res.renderPage is not set' });
      }
    }
  };

  plugin.hooks.on('we:before:load:plugin:features', function (we, done) {
    // view logic
    we.view = new View(we);
    we.view.initialize(we);

    we.view.assets.addCoreAssetsFiles(plugin);

    /**
     * Load all plugin template paths
     *
     * Runs in we.js bootstrap
     */
    we.class.Plugin.prototype.loadTemplates = function loadTemplates (cb) {
      const we = this.we,
        self = this;

      let templateName;

      // load template folders
      we.utils.listFilesRecursive(this.templatesPath,  (err, list)=> {
        if (err) return cb(err);

        for (let i = 0; i < list.length; i++) {
          if (list[i].indexOf('.hbs', list[i].length - 4) >-1) {
            templateName = list[i].substring(0, list[i].length-4).substring(self.templatesPath.length+1);
            // ensures that template names always have / slashes
            if (path.sep != '/') templateName = templateName.split(path.sep).join('/');

            self.templates[templateName] = list[i];
            we.view.configuration.templates[templateName] = list[i];
          }
        }
        cb();
      });
    };

    /**
     * Load helpers from folder server/helpers
     *
     * @param  {Object}   we
     * @param  {Function} cb callback
     */
    we.class.Plugin.prototype.loadHelpers = function loadHelpers (cb) {
      const we = this.we,
        self = this;

      let name, file;

      fs.readdir(this.helpersPath , function afterReadPHelperFolder (err, list) {

        if (err) {
          if (err.code === 'ENOENT') return cb();
          return cb(err);
        }

        for (let i = 0; i < list.length; i++) {
          if (list[i].indexOf('.js', list[i].length - 3) >-1) {

            name = list[i].substring(0, list[i].length-3);
            file = self.helpersPath +'/'+list[i];

            self.helpers[name] = file;
            we.view.configuration.helpers[name] = file;
          }
        }

        cb();
      });
    };

    // plug the response formater for text/html response formats
    we.responses.addResponseFormater('text/html', plugin.htmlFormater, 0);
    we.responses.addResponseFormater('html', plugin.htmlFormater);

    done();
  });

  plugin.hooks.on('we:router:request:after:load:context', [
    function runTitleMiddleware(data, done) {
      // only run on html response
      if (!data.req.accepts('html')) return done();
      plugin.we.router.title.middleware(data.req, data.res, done);
    },
    function runMetatagMiddleware(data, done) {
      // only run on html response
      if (!data.req.accepts('html')) return done();
      plugin.we.router.metatag.middleware(data.req, data.res, done);
    },
    function runBreadcrumbMiddleware(data, done) {
      // only run on html response
      if (!data.req.accepts('html')) return done();
      plugin.we.router.breadcrumb.middleware(data.req, data.res, done);
    }
  ]);

  plugin.hooks.on('we-core:on:register:templates', function (we, done) {
    we.log.verbose('registerAllViewTemplates step');
    we.view.registerAll();
    done();
  });

  plugin.hooks.on('plugin:load:features', function (data, done) {
    const we = data.we,
      plugin = data.plugin;

    we.utils.async.series([
      function loadPluginAssets(done) {
        var name;

        for (name in plugin.assets.css) {
          we.view.assets.addCss(name, plugin.assets.css[name]);
        }

        for (name in plugin.assets.js) {
          we.view.assets.addJs(name, plugin.assets.js[name]);
        }

        done();
      },
      function loadPluginTemplates(done) {
        plugin.loadTemplates(done);
      },
      function loadPluginHelpers(done) {
        plugin.loadHelpers(done);
      },
      function setPluginLayouts(done) {
        if (plugin.layouts) {
          we.utils._.merge(we.view.configuration.layouts, plugin.layouts);
        }

        done();
      }
    ], done);
  });

  plugin.events.on('we:after:load:express', function (we) {
    // set express config
    we.view.setExpressConfig(we.express, we);
  });

  plugin.events.on('system-settings:updated:after', (we)=> {
    if (we.systemSettings.siteTheme) {
      we.view.appTheme = we.systemSettings.siteTheme;
    }

    if (we.systemSettings.activeThemes != we.view.systemSettingsActiveThemes) {
      // active themes updated!
      let themes = [];
      if (we.systemSettings.activeThemes) {
        themes = we.systemSettings.activeThemes.split('|');
      }

      let themesToLoad = [];

      themes.forEach( (t)=> {
        if (!we.view.themes[t]) themesToLoad.push(t);
      });

      we.utils.async.each(themesToLoad, (name, done)=> {
        we.view.loadTheme(name, done);
      }, ()=> {
        we.view.systemSettingsActiveThemes = we.systemSettings.activeThemes;
      });
    }
  });

  plugin.events.on('system-settings:updated:after', (we)=> {
    if (we.systemSettings.themesToUpdate != we.view.themesToUpdate) {
      if (!we.view.themesToUpdate) {
        // found themes to update but not updated:
        we.view.themesToUpdate = we.systemSettings.themesToUpdate;
        return null;
      }

      if (!we.systemSettings.themesToUpdate) {
        // all themes updated!
        let old = JSON.parse(we.view.themesToUpdate);

        let updatedNames = Object.keys(old);

        we.utils.async.each(updatedNames, (name, done)=> {
          we.view.loadTheme(name, done);
        }, ()=> {
          we.view.themesToUpdate = null;
        });

      } else {
        // some themes updated!
        let allToUpdate = JSON.parse(we.systemSettings.themesToUpdate); // new
        let old = JSON.parse(we.view.themesToUpdate); // old

        let updatedNames = Object.keys(old);

        we.utils.async.each(updatedNames, (name, done)=> {
          if (allToUpdate[name]) return done(); // this theme not is updated
          we.view.loadTheme(name, done); // load updated theme
        }, ()=> {
          we.view.themesToUpdate = we.systemSettings.themesToUpdate;
        });
      }
    }
  });


  return plugin;
};