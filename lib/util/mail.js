var log = require('logging').from(__filename),
    EmailJs = require('emailjs');

function send(options, cb) {

    if (!options.to) { log('to required'); cb();}
    if (!options.subject) { log('subject required'); cb();}
    if (!options.message) { log('message required'); cb();}

    var Server  = EmailJs.server.connect({
        user:    "catapult@opower.com",
        password:"Energy#1",
        host:    "smtp.gmail.com",
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

    Server.send(Message,
    function(err, result){
        if (err){
            log('error', err.message || err);
        }
        cb(err, result);
    });
}

function notify(options, cb) {

    log(options);
    cb();

}

//if (this.debug) {
//    send({to: 'dylan.greene@opower.com', subject: 'Catapult test', message: 'This is a test of catapult!', html: '<html>i <i>hope</i> this works!</html>'}, function(err, result){
//        log('result', result);
//    });
//}

module.exports.notify = notify;
module.exports.send = send;