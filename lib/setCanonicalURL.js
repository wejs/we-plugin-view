function setCanonicalURL(req, res) {
  // canonical url alias
  if (req.urlAlias && req.urlAlias.alias) {
    res.locals.metatag += '<link rel="canonical" href="'+req.urlAlias.alias+'" />';
  }
}

module.exports = setCanonicalURL;