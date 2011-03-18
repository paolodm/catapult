var log = require('logging').from('__filename'),
    Mailer = require('mailer');

function send(options, callback) {

    if (!options.to) { log('to required'); callback();}
    if (!options.subject) { log('subject required'); callback();}
    if (!options.message) { log('message required'); callback();}

    Mailer.send({
        host:     'localhost',
        port:     '25',
        ssl:      false,
        domain:   'localhost',
        to:       options.to,
        from:     options.from || 'Catapult <catapult@opower.com>',
        subject:  options.subject,
        body:     options.message,
        authentication: false
    },
    function(err, result){
        if (err){
            log('error', err.message);
        } else {
            callback && callback(result);
        }
    });
}

function notify(options) {
    log(options);
}

module.exports.notify = notify;
module.exports.send = send;