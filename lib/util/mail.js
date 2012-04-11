var log = require('logging').from(__filename),
    Nodemailer = require('nodemailer');

if (!process.env.CATAPULT_EMAIL) { log('*** catapult email required'); }
if (!process.env.CATAPULT_EMAIL_PASSWORD) { log('*** catapult password required'); }

    var smtpTransport = Nodemailer.createTransport('SMTP',{
        service: "Gmail",
        auth: {
            user: process.env.CATAPULT_EMAIL,
            pass: process.env.CATAPULT_EMAIL_PASSWORD
        }
    });

    function send(options, cb) {

        if (!options.to) { log('to required'); return cb();}
        if (!options.subject) { log('subject required'); return cb();}
        if (!options.text) { log('message required'); return cb();}

       var message = {
           to:              options.to,
           from:            options.from || 'Catapult <catapult@opower.com>',
           replyTo:         'Dylan Greene <dylan.greene@opower.com>',
           subject:         options.subject,
           text:            options.text,
           html:            options.html
       };

        smtpTransport.sendMail(message,
        function(err, result){
            if (err){
                log('error sending to', options.to, err.message || err);
            } else {
                log('sent email to', options.to);
            }
            cb(err, result);
        });

    }

function notify(options, cb) {
    if (process.platform === 'darwin') {
        //options.to = 'dylan.greene@opower.com';
        return cb();
    }
    send(options, cb)

}

module.exports.notify = notify;
module.exports.send = send;