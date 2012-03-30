var log = require('logging').from(__filename),
    EmailJs = require('emailjs');

function send(options, cb) {

    if (!options.to) { log('to required'); return cb();}
    if (!options.subject) { log('subject required'); return cb();}
    if (!options.text) { log('message required'); return cb();}

    var Server  = EmailJs.server.connect({
        user:    process.env.CATAPULT_EMAIL,
        password:process.env.CATAPULT_EMAIL_PASSWORD,
        host:    'smtp.gmail.com',
        ssl:     true
    });

   var headers = {
       to:              options.to,
       from:            options.from || 'Catapult <catapult@opower.com>',
       'reply-to':      'Dylan Greene <dylan.greene@opower.com>',
       subject:         options.subject,
       text:            options.text,
       authentication: false
   };

    var Message = EmailJs.message.create(headers);

    if (options.html) {
        Message.attach({data: options.html, alternative:true});
    }
    log('sending email to', options.to);
    Server.send(Message,
    function(err, result){
        if (err){
            log('error', err.message || err);
        }
        process.exit();
        cb(err, result);
    });
}

function notify(options, cb) {
    if (process.platform === 'darwin') {
        options.to = 'dylan.greene@opower.com';
    }
    send(options, cb)

}

module.exports.notify = notify;
module.exports.send = send;