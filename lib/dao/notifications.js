var log         = require('logging').from(__filename),
    Async       = require('async'),
    Cache       = require('../util/cache'),
    Constants   = require('../constants'),
    Format      = require('../util/format'),
    FS          = require('fs'),
    Mail        = require('../util/mail');

var DB_Jobs;

function check() {
    var stats, age = 0;

    try {
        stats = FS.statSync(__dirname + '/../../data/candidates-old.txt');
        age = Format.hours(new Date(stats.mtime));
    } catch(ex) {
        Cache.load('candidates.txt', function(err, current){
            log('creating candidates-old.txt');
            Cache.save('candidates-old.txt', current);
        });
    }

    log('age of old data', age, 'hours');
    return age > 24;
}

function init(options) {
    DB_Jobs = options.DB_Jobs;

    if (!check()) {
        log('not time yet to run email updates.');
        return;
    }

    Async.auto({
        previous: function(next){
            Cache.load('candidates-old.txt', next);
        },
        current: function(next){
            Cache.load('candidates.txt', next);
        },
        compare: ['previous', 'current', function(next, results) {
            var previousRaw = JSON.parse(results.previous);
            var previous = {};
            previousRaw.forEach(function(candidate){
                previous[candidate.id] = candidate;
            });


            var current = JSON.parse(results.current);
            compare(previous, current, next);
        }],
        notify: ['compare', function(next, results) {
            notify(results.compare, next);
        }],
        copyFile: ['notify', 'current', function(next, results){
            log('saving over old');
            Cache.save('candidates-very-old.txt', results.previous);
            Cache.save('candidates-old.txt', results.current);
        }]
    }, function(err, results){
        if (err) {
            log('Notification error', err);
        } else {
            log('Notifications sent', results.notify);
        }
    });

}

function html(title, message) {
    var out = [];

    out.push('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">');
    out.push('<html xmlns="http://www.w3.org/1999/xhtml">');
    out.push('<head>');
    out.push('	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />');
    out.push('	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>');
    out.push('	<title>' + title + '</title>');
    out.push('	<style type="text/css">');
    out.push('		#outlook a {padding:0;} /* Force Outlook to provide a "view in browser" menu link. */');
    out.push('		body{width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0;}');
    out.push('		.ExternalClass {width:100%;} /* Force Hotmail to display emails at full width */');
    out.push('		.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}');
    out.push('		#backgroundTable {margin:0; padding:0; width:100% !important; line-height: 100% !important;}');
    out.push('		p {margin: 1em 0;}');
    out.push('		h1, h2, h3, h4, h5, h6 {color: black !important;}');
    out.push('		h1 a, h2 a, h3 a, h4 a, h5 a, h6 a {color: blue !important;}');
    out.push('		h1 a:active, h2 a:active,  h3 a:active, h4 a:active, h5 a:active, h6 a:active {');
    out.push('		color: red !important; /* Preferably not the same color as the normal header link color.  There is limited support for psuedo classes in email clients, this was added just for good measure. */');
    out.push('		}');
    out.push('		h1 a:visited, h2 a:visited,  h3 a:visited, h4 a:visited, h5 a:visited, h6 a:visited {');
    out.push('		color: purple !important; /* Preferably not the same color as the normal header link color. There is limited support for psuedo classes in email clients, this was added just for good measure. */');
    out.push('		}');
    out.push('		table td {border-collapse: collapse;}');
    out.push('		a {color: orange;}');
    out.push('	</style>');
    out.push('</head>');
    out.push('<body>');
    out.push('<table cellpadding="0" cellspacing="0" border="0" id="backgroundTable">');
    out.push('	<tr>');
    out.push('		<td valign="top">');
    out.push(message);
    out.push('		</td>');
    out.push('	</tr>');
    out.push('</table>');
    out.push('</body>');
    out.push('</html>');
    return out.join('\n');
}

function message(item) {

    var out = [];
    out.push('<p>Welcome to your update from <a href="https://catapult.opower.com">Catapult</a>, your friendly Opower-created referral and req tracking tool.</p>');

    item.changes.forEach(function(candidate){
        out.push('<p>');
        if (candidate.isNew) {
            out.push('<div style="color:green;">* NEW CANDIDATE! *</div>');
            out.push('<div><a href="https://catapult.opower.com/search/' + Format.url(candidate.name) +'" style="color: #0071D8; font-weight: bold;">' + candidate.name + '</a></div>');
            out.push('<div><a href="https://catapult.opower.com/jobs/' + Format.url(candidate.job) + '" style="color: #777;">' + candidate.job + '</a></div>');
            out.push('<div>Current state: ' + candidate.status + '</div>');
        } else {
            out.push('<div><a href="https://catapult.opower.com/search/' + Format.url(candidate.name) +'" style="color: #0071D8; font-weight: bold;">' + candidate.name + '</a></div>');
            out.push('<div><a href="https://catapult.opower.com/jobs/' + Format.url(candidate.job) + '" style="color: #777;">' + candidate.job + '</a></div>');
            out.push('<div>Previous state: ' + candidate.oldStatus + '</div>');
            out.push('<div>New state: <span style="font-weight: bold;">' + candidate.newStatus + '</span></div>');
        }
        out.push('</p>');
    });

    if (item.candidates.length) {
        out.push('');
        out.push('<p>You have other active candidates in Catapult:</p>');
        item.candidates.forEach(function(candidate){
            out.push('<p>');
            out.push('<div><a href="https://catapult.opower.com/search/' + Format.url(candidate.name) +'" style="color: #0071D8; font-weight: bold;">' + candidate.name + '</a></div>');
            out.push('<div><a href="https://catapult.opower.com/jobs/' + Format.url(candidate.job) + '" style="color: #777;">' + candidate.job + '</a></div>');
            out.push('<div style="font-weight: bold;">Current state: ' + candidate.status + '</div>');
            out.push('<div>Days in this state: <span style="font-weight: bold;">' + candidate.days + '</span></div>');
            out.push('</p>');
        });
    }

    //out.push('Be sure to tell recruiting when you have new candidates so they can get the white glove treatment.');
    out.push('');
    out.push('<p style="font-size:11px">Emails are automatic sent once a day via Catapult to Opower employees when referrals change state. Data comes from Jobvite. This email feature was an Innovation Day 2012 project.');
    out.push('<a href="https://catapult.opower.com/">https://catapult.opower.com</a>. </p>');

    return {
        html:   html('Catapult referral updates for ' + item.name, out.join('\n')),
        text:   out.join('\n').replace(/<(.|\n)+?>/g, '')};
}


function notify(data, cb) {
    data = data.map(function(item){
        return item;
    }).filter(function(item) {
        return item.email;
    });
    Async.forEachSeries(data, function(item, next){
        var m = message(item);
        Mail.notify({
            to:         item.email,
            text:       m.text,
            html:       m.html,
            subject:    'Catapult referral updates for ' + item.name
        }, next);
    }, function(err) {
        log('done sending', data.length, 'notifications');
        cb(err, data.length);
    });
}


function newReferrer(name) {

    var email = name.replace(/\sand\s/, ';').split(/[,;]/).map(function(name) {
        name = name.trim();
        var names = name.split(' ').length;
        return (names == 2) ? name + ' <' + name.toLowerCase().replace(/\s/g, '.') + '@opower.com>' : null;
    }).filter(function(item){ return item; }).join('; ');

    return {
        name: name,
        email: email,
        changes: [],
        candidates: []
    };
}


function compare(Previous, Current, cb) {

    var results = {};

    Current.forEach(function(candidate){
        if (!candidate) {
            return;
        }

        if (!candidate.id || candidate.source_type != 'Employee Referral' || Constants.STATUS_INACTIVE[candidate.status] || !DB_Jobs.get(candidate.job_id)) {
            return;
        }

        var c = Previous[candidate.id];
        if (!c) {
            if (candidate.source_type == 'Employee Referral') {
                results[candidate.source] = results[candidate.source] || newReferrer(candidate.source);
                results[candidate.source].changes.push({
                    isNew: true,
                    name: candidate.name,
                    job: DB_Jobs.get(candidate.job_id).title,
                    status: candidate.status
                });
                candidate.found = true;
            }
        } else if (c.status != candidate.status) {
            if (candidate.source_type == 'Employee Referral') {
                results[candidate.source] = results[candidate.source] || newReferrer(candidate.source);
                results[candidate.source].changes.push({
                    name: candidate.name,
                    job: DB_Jobs.get(candidate.job_id).title,
                    newStatus: candidate.status,
                    oldStatus: c.status
                });
                candidate.found = true;
            }
        }
    });


    Current.forEach(function(candidate){
        if (!candidate) {
            return;
        }

        if (candidate.found
            || Constants.STATUS_INACTIVE[candidate.status]
            || candidate.source_type != 'Employee Referral'
            || !results[candidate.source]
            || !DB_Jobs.get(candidate.job_id)) {
            return;
        }

        results[candidate.source] = results[candidate.source] || newReferrer(candidate.source);

        results[candidate.source].candidates.push({
            name: candidate.name,
            job: DB_Jobs.get(candidate.job_id).title,
            status: candidate.status,
            days: Format.days(candidate.date)
        });
    });


    cb(null, results);
}

module.exports = {
    init:       init,
    notify:     notify
};