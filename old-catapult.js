/*!
 * Old Catapult
 * Dylan Greene
 */

var log = require('logging').from(__filename),
    Express = require('express'),
    Server = module.exports = Express.createServer();


var PORT = parseInt(process.env.PORT || 8000);

Server.get('*', function(req, res){
    log('here comes another one...');
    res.send('<html><body>' +
            '<div style="width: 80%; border: 10px solid black; padding: 30px; margin: auto; text-align: center;"><h1>This is the old Catapult url.</h1>' +
            '<h1>Use this instead:</h1>' +
            '<h1><a href="http://catapult.opower.com" style="color: blue">http://catapult.opower.com</a></h1>' +
            '<h2>This warning page may go away at any time.</h2>' +

            'The new Catapult is accessible from home and the SF office!</div></body></html>');
});


Server.listen(PORT, null);
log('Starting Old Catapult Warning Message on', PORT);
