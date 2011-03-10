/*!
 * Catapult
 * Dylan Greene
 */
require('proto');

var log = require('logging').from(__filename),
    Express = require('express'),
    Server = module.exports = Express.createServer();

var Assets = require('./lib/assets');
var Controller = require('./lib/controller');

var VIEWS = __dirname + '/views',
    PUBLIC = __dirname + '/public',
    PORT = parseInt(process.env.PORT || 3300);

if (process.platform != 'darwin' && process.platform != 'cygwin') {
    log('Platform:', process.platform);
    Server.set('env', 'production');
}

//in case of crash. I've never seen this used, got it from somebody else's code.
process.title = 'catapult';
/*
process.addListener('uncaughtException', function (err, stack) {
    log('++++++++++++EXCEPTION++++++++++++');
    err.message && log(err.message);
    err.stack && log(err.stack);
    log('+++++++++++++++++++++++++++++++++');
});
*/
function production(){
    //Server.use(Express.conditionalGet());
    //Server.use(Express.cache());
    //Server.use(Express.gzip());

    PORT = 8000;
    log('running in production mode');
    Server.locals({
        production: true
    });
}

function development() {
    //Server.use(Express.conditionalGet());
    //Server.use(Express.cache());
    //Server.use(Express.gzip());

    Server.locals({
        development: true
    });
 
    log('running in development mode');
}


function common() {
    Server.set('views', VIEWS);

    Server.locals({
        log: log
    });

    Server.dynamicHelpers({
        signedIn: function(req, res) {
            return !!req.session.email;
        }
    });

    Server.use(Express.cookieParser());
    Server.use(Express.session({ secret: 'catapult' }));
    Server.use(Express.bodyParser());
    Server.use(Express.favicon(PUBLIC + '/favicon.ico'));
    Server.use(Express.static(PUBLIC));
    Server.use(Server.router);
}

Server.configure('development', development);
Server.configure('production', production);
Server.configure(common);


Server.error(function(err, req, res, next){
    log('****************ERROR****************');
    log('http://' + req.headers.host + req.url);
    err.message && log(err.message);
    err.arguments && log(err.arguments);
    err.stack && log(err.stack);
    log('*************************************');
});

// Get rid of urls that end in / - makes Google Analytics easier to read
Server.get(/^.+\/$/, function(req, res){
    res.redirect(req.url.substr(0, req.url.length - 1));
});

Assets.addHandler({Server: Server});
Controller.addHandlers({Server: Server});

// Required for 404's to return something
Server.get('/*', function(req, res){
    var new_url,
        extension = req.url.match(/\....$/);

    if (extension) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Cannot ' + req.method + ' ' + req.url);
    }
    else {
        log('404', req.url, req.headers.referrer || req.headers.referer || req.session.jobboard || '');

        var array = req.url.replace(/\/\//g, '/').split('/');
        if (array.pop() == '') { array.pop(); }

        new_url = array.join('/') || '/';
        res.redirect(new_url);
    }
});

Server.listen(PORT, null);
log('Starting Catapult on', PORT);
