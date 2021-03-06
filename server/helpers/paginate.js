/**
 * We.js paginate helper to build pagination for lists
 *
 * {{paginate count=metadata.count limit=query.limit currentPage=query.page req=req}}
 */

module.exports = function(we) {
  return function paginateHelper() {
    const options = arguments[arguments.length-1];
    let currentUrl = '';
    let theme = options.hash.theme || options.data.root.theme,
       reqQuery, params;
    // old params
    if (options.hash.req) {
      if (options.hash.req.url && options.hash.req.url.split) {
        currentUrl = options.hash.req.url.split('?')[0].split('#')[0];
      }

      reqQuery = we.utils._.clone(options.hash.req.query);
      delete reqQuery.page;
      let pt = [];
      for (let param in reqQuery) {
        pt.push(param+'='+reqQuery[param]);
      }
      params = pt.join('&');
      if (params) params = '&'+params;
    } else {
      return '';
    }

    // pagger var, used in paggination template
    const pagger = {
      haveMoreBefore: false,
      previus: false,
      links: [],
      last: {},
      next: false,
      haveMoreAfter: false,
      hideSumary: options.hash.hideSumary,
      count: Number(options.hash.count) || 0,
      limit: Number(options.hash.limit) || 0,
      maxLinks: Number(options.hash.maxLinks) || 2,
      currentPage: Number(options.hash.currentPage) || 0,
      locals: options.hash.req.res.locals
    };

    if (options.hash.req.res.locals.data) {
      pagger.recordsLength = options.hash.req.res.locals.data.length;
    }

    let pageCount = Math.ceil(pagger.count/pagger.limit);
    if (!pageCount || pageCount == 1) return '';

    let startInPage = 1;
    let endInPage = pageCount;
    let totalLinks = (pagger.maxLinks*2) +1;

    if ( totalLinks < pageCount ) {
      // check if have more before
      if ((pagger.maxLinks+2) < pagger.currentPage) {
        startInPage = pagger.currentPage - pagger.maxLinks;
        pagger.first = {
          p: currentUrl+'?page='+1+params,
          n: 1
        };
        pagger.haveMoreBefore = true;
      }

      if ( (pagger.maxLinks+pagger.currentPage+1) < pageCount ) {
        endInPage = pagger.maxLinks+pagger.currentPage;
        pagger.last = {
          p: currentUrl+'?page='+pageCount+params,
          n: pageCount
        };
        pagger.haveMoreAfter = true;
      }
    }

    // each link
    for (let i = startInPage; i <= endInPage; i++) {
      pagger.links.push({
        p: currentUrl+'?page='+i+params,
        n: i,
        active: ( i == pagger.currentPage )
      });
    }

    if (pagger.currentPage > 1) {
      pagger.previus = {
        p: currentUrl+'?page='+(pagger.currentPage-1)+params,
        n: (pagger.currentPage-1),
      };
    }

    if (pagger.currentPage < pageCount) {
      pagger.next = {
        p: currentUrl+'?page='+(pagger.currentPage+1)+params,
        n: (pagger.currentPage+1),
      };
    }

    return new we.hbs.SafeString(
      we.view.renderTemplate('paginate', theme, pagger)
    );
  };
};