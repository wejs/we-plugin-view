module.exports = {
  verifyAllThemesUpdate(req, res) {
    const aclAccess = req.we.acl.canStatic('manage_theme', req.userRoleNames);
    const haveKey = (req.body.manageKey == req.we.config.manageKey);

    if (!aclAccess || !haveKey) {
      return res.forbidden();
    }

    req.we.view.update.verifyAllThemesUpdate(req.we, (err, result)=> {
      if (err) return res.queryError(err);

      res.locals.data = result;
      return res.ok();
    });
  }
};