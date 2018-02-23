module.exports = {
  findThemes(req, res) {
    const we = req.we;

    if (!haveAccess(req)) return res.forbidden();

    res.locals.themes = we.view.themes;
    res.locals.themeConfigs = we.config.themes;

    res.ok();
  },

  getAllThemes(req, res) {
    const we = req.we;

    res.locals.themes = we.view.themes;
    res.locals.themeConfigs = we.config.themes;

    let themes = {};

    for(let name in res.locals.themes) {
      if (!res.locals.themes[name].description) continue;

      themes[name] = {
        name: name,
        imageThumbnail: res.locals.themes[name].imageThumbnail,
        imageLarge: res.locals.themes[name].imageLarge,
        description: res.locals.themes[name].description,
        configs: res.locals.themes[name].configs
      };
    }

    let firstThemeName;
    if (res.locals.themes && res.locals.themes[0]) {
      firstThemeName = res.locals.themes[0].name;
    }

    res.ok({
      themes: themes,
      enabled: we.systemSettings.siteTheme || firstThemeName
    });
  },

  installTheme(req, res, next) {
    const we = req.we;

    if (!haveAccess(req)) return res.forbidden();

    // req.params.name
    // req.body.colorName
    // req.body.release

    if (!req.body.release) {
      return req.badRequest('admin:installTheme:Release is required');
    }

    if (we.view.isThemeInstalled(req.params.name)) {
      return we.controllers.admin.enableTheme(req, res, next);
    }

    we.view.downloadAndInstallTheme(req.params.name, req.body.release, (err)=> {
      if (err) return res.queryError(err);

      const activeThemes = Object.keys(we.view.themes).join('|');

      req.we.plugins['we-plugin-db-system-settings']
      .setConfigs({
        activeThemes: activeThemes,
        siteTheme: req.params.name,
        [ req.params.name + 'ColorName' ]: (req.body.colorName || 'default')
      }, (err, updatedSettings)=> {
        if (err) return res.queryError(err);

        res.addMessage('success', {
          text: 'admin:installTheme.success'
        });

        res.locals.data = {
          updatedSettings: updatedSettings
        };

        // small timeout to wait system settings lifecircle that will enable this theme in all running instances:
        setTimeout( ()=> {
          res.ok();
        }, 200);
      });
    });
  },

  updateTheme(req, res) {
    const we = req.we;

    if (!haveAccess(req)) return res.forbidden();

    if (!we.systemSettings.themesToUpdate) return res.ok();

    let themesToUpdate = JSON.parse(we.systemSettings.themesToUpdate);

    if (!themesToUpdate[req.params.name]) return res.ok();

    we.view.downloadAndInstallTheme(req.params.name, req.body.release, (err)=> {
      if (err) return res.queryError(err);

      delete themesToUpdate[req.params.name];

      if (!Object.keys(themesToUpdate).length) {
        themesToUpdate = null;
      }

      req.we.plugins['we-plugin-db-system-settings']
      .setConfigs({
        themesToUpdate: JSON.stringify(themesToUpdate || {})
      }, (err)=> {
        if (err) return res.queryError(err);

        res.addMessage('success', {
          text: 'admin:updateTheme.success'
        });

        setTimeout( ()=> {
          res.ok({
            themesToUpdate: themesToUpdate
          });
        }, 200);

      });
    });
  },

  enableTheme(req, res) {
    const we = req.we;

    if (!haveAccess(req)) return res.forbidden();

    if (!req.body.release) {
      return req.badRequest('admin:installTheme:Release is required');
    }

    we.view.enableTheme(req.params.name, (err)=> {
      if (err) return res.queryError(err);

      req.we.plugins['we-plugin-db-system-settings']
      .setConfigs({
        siteTheme: req.params.name,
        [ req.params.name + 'ColorName' ]: (req.body.colorName || 'default')
      }, (err, updatedSettings)=> {
        if (err) return res.queryError(err);

        res.addMessage('success', {
          text: 'admin:enableTheme.success'
        });

        res.locals.metadata = {
          updatedSettings: updatedSettings
        };

        res.ok();
      });
    });
  },
  verifyAllThemesUpdate(req, res) {
    if (!haveAccess(req)) return res.forbidden();

    req.we.view.update.verifyAllThemesUpdate(req.we, (err, result)=> {
      if (err) return res.queryError(err);

      res.locals.data = result;
      return res.ok();
    });
  }
};

function haveAccess(req) {
  const aclAccess = req.we.acl.canStatic('manage_theme', req.userRoleNames);
  const haveKey = (req.we.config.manageKey && (req.body.manageKey == req.we.config.manageKey));

  if (aclAccess || haveKey) {
    return true;
  }

  return false;
}