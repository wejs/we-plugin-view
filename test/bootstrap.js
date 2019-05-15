const projectPath = process.cwd(),
      path = require('path'),
      deleteDir = require('rimraf'),
      async = require('async'),
      testTools = require('we-test-tools'),
      // ncp = require('ncp').ncp,
      We = require('we-core');

let we;

before(function (callback) {
  testTools.copyLocalSQLiteConfigIfNotExitst(projectPath, callback);
});


before(function(callback) {
  this.slow(100);

  we = new We({ bootstrapMode: 'test' });

  testTools.init({}, we);

  we.bootstrap({
    enableRequestLog: false,

    i18n: {
      directory: path.resolve(__dirname, '..', 'config/locales'),
      updateFiles: true,
      locales: ['en-us']
    },
    themes: {
      enabled: ['we-theme-site-wejs'],
      app: 'we-theme-site-wejs'
    }
  }, callback);
});

// start the server:
before(function (callback) {
  we.startServer(callback);
});

// after all tests remove test folders and delete the database:
after(function (callback) {
  testTools.helpers.resetDatabase(we, (err)=> {
    if(err) return callback(err);

    const tempFolders = [
      projectPath + '/files/tmp',
      projectPath + '/files/config',
      projectPath + '/files/uploads',
      projectPath + '/files/templatesCacheBuilds.js',
      projectPath + '/database.sqlite'
    ];

    async.each(tempFolders, (folder, next)=> {
      deleteDir( folder, next);
    }, (err)=> {
      if (err) throw new Error(err);
      we.exit(callback);
    });
  });
});
