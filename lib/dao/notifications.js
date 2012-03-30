var log         = require('logging').from(__filename),
    Async       = require('async'),
    Cache       = require('../util/cache'),
    Constants   = require('../constants'),
    Format      = require('../util/format'),
    FS          = require('fs'),
    Mail        = require('../util/mail');

var DB_Jobs;

function check() {
    var stats;

    try {
        stats = FS.statSync(__dirname + '/../../data/candidates-old.txt');
    } catch(ex) {
        stats = FS.statSync(__dirname + '/../../data/candidates.txt');
    }

    var age = Format.hours(new Date(stats.mtime));
    log('age of old data', age, 'hours');
    return age > 6;

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

function message(item) {
    var out = [];
    out.push('Updates for ' + item.name);
    out.push('');
    item.changes.forEach(function(candidate){
        if (candidate.isNew) {
            out.push('NEW! ' + candidate.name + ' for ' + candidate.job + ': ' + candidate.status);
        } else {
            out.push(candidate.name + ' for ' + candidate.job + ': ' + candidate.oldStatus + ' -> ' + candidate.newStatus);
        }
    });
    if (item.candidates.length) {
        out.push('');
        out.push('Your other active candidates:');
        item.candidates.forEach(function(candidate){
                out.push(candidate.name + ' for ' + candidate.job + ': ' + candidate.status + ' - for ' + candidate.days + ' days.');
        });
    }
    out.push('');
    out.push('More info: http://catapult.opower.com/');
    out.push('');
    out.push('Be sure to tell recruiting if you have new candidates.');
    out.push('');
    out.push('Automatic email sent via Catapult, created by Dylan Greene using Node.JS.');

    return {html: false, text: out.join('\n')};
}


function notify(data, cb) {
    data = data.map(function(item){
        return item;
    }).filter(function(item) {
        return item.email;
    });
    Async.forEach(data, function(item, next){
        var m = message(item);
        Mail.notify({
            to:         item.email,
            text:       m.text,
            html:       m.html,
            title:      '[Catapult] Your Referral Update'
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

        if (!candidate.id || candidate.source_type != 'Employee Referral' || Constants.STATUS_INACTIVE[candidate.status]) {
            return;
        }

        var c = Previous[candidate.id];
        if (!c) {
            if (candidate.source_type == 'Employee Referral') {
                results[candidate.source] = results[candidate.source] || newReferrer(candidate.source);
                results[candidate.source].changes.push({
                    isNew: true,
                    name: candidate.name,
                    job: (DB_Jobs.get(candidate.job_id) ? DB_Jobs.get(candidate.job_id).title : 'Unknown Job'),
                    status: candidate.status
                });
                candidate.found = true;
            }
        } else if (c.status != candidate.status) {
            if (candidate.source_type == 'Employee Referral') {
                results[candidate.source] = results[candidate.source] || newReferrer(candidate.source);
                results[candidate.source].changes.push({
                    name: candidate.name,
                    job: (DB_Jobs.get(candidate.job_id) ? DB_Jobs.get(candidate.job_id).title : 'Unknown Job'),
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

        if (candidate.found || !results[candidate.source] || Constants.STATUS_INACTIVE[candidate.status] ) {
            return;
        }

        results[candidate.source].candidates.push({
            name: candidate.name,
            job: (DB_Jobs.get(candidate.job_id) ? DB_Jobs.get(candidate.job_id).title : 'Unknown Job'),
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