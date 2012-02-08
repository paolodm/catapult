var log         = require('logging').from(__filename),
    Step        = require('step'),
    Reports     = require('jobvite').Reports,
    Format      = require('../util/format'),
    Constants   = require('../constants'),
    Cache       = require('../util/cache'),
    Organize    = require('./organize');

var last_updated = 0,
    in_progress = false,
    auto_update_counter = 0,
    jobvite_username = process.env.JOBVITE_USERNAME,
    jobvite_password = process.env.JOBVITE_PASSWORD;

function auto_update() {
    auto_update_counter++;
    log('Autoupdate', auto_update_counter);
    update(auto_update_complete);
}

function auto_update_complete() {
    log ('Autoupdate Complete', 'Next update in', Constants.UPDATE_INTERVAL_MINUTES, 'minutes');
    setTimeout(auto_update, Constants.UPDATE_INTERVAL_MINUTES * Constants.MILLISECONDS_PER_MINUTE);
}

function update(callback) {

    if (!jobvite_username || !jobvite_password) {
        log('====UPDATE NOT POSSIBLE===');
        log('JOBVITE_USERNAME and JOBVITE_PASSWORD environment variables must be set.');
        callback && callback();
        return;
    }


    if (in_progress) {
        log('update already in progress');
        log('Too soon, no need to update.', 'Next update:', Constants.UPDATE_INTERVAL_MINUTES, 'minutes');
        callback && callback();
        return;
    }

    Step(
        function() {
            log('Starting update....');
            in_progress = new Date();
            log_progress(callback);
            this();
        },
        function (err) {
            err && log(err, err.stack);
            load_jobs(this);
        },
        function(err) {
            err && log(err, err.stack);
            load_candidates(this);
        },
        function(err) {
            err && log(err, err.stack);
            Organize.update(this);
        },
        function (err) {
            err && log(err, err.stack);
            finished_update(callback);
        }
    );
}

function finished_update(callback) {
    log('Load and organize complete');
    last_updated = new Date();
    in_progress = false;
    callback && callback();
}

function load_jobs(callback) {
    Reports.config({
        report_id: '6yWaVfwj', //jobs
        jobvite_username: jobvite_username,
        jobvite_password: jobvite_password,
        format: function(row) {
            var id = Format.getId(row[0]);
            return id && row.length > 1 ? {
                id: id,
                title: Format.removeHTML(row[0]).trim(),
                department: row[1].trim(),
                recruiters: Format.people(row[2]),
                managers: Format.people(row[3]),
                location: row[4].trim(),
                status: row[5].trim(),
                isOpen: row[6].trim() == 'True'
            } : false;
       }
    });
    log('Loading Jobs...');
    Reports.load(function(data) {
        if (!data) {
            log('NO JOBS WTF JOBVITE');
        } else {
            Cache.save('jobs.txt', JSON.stringify(data));
        }
        callback(null, data);
    });
}


function load_candidates (callback) {
    Reports.config({
        report_id: '6xWaVfwi', //candidates
        jobvite_username: jobvite_username,
        jobvite_password: jobvite_password,
        format: function(row) {
            var id = Format.getId(row[1]);
            if (!id) { return false; }
            var data = {
                id: id,
                date: +new Date(row[0]),
                date_short: row[0],
                name: Format.fix_all_caps(Format.removeHTML(row[1]).trim().replace(/\(.*\)/, '')),
                status: row[2].trim(),
                source_type: row[3].trim().replace(/OPOWER /, ''),
                source: Format.fix_source(row[4]),
                job_id: Format.getId(row[5]),
                date_new: +new Date(row[6])
            };
            if (data.source) {
                if (data.source.indexOf('facebook') > -1) {
                    data.source_type = 'Facebook'
                } else if (data.source.indexOf('twitter') > -1) {
                    data.source_type = 'Twitter'
                } else if (data.source.indexOf('linkedin') > -1) {
                    data.source_type = 'LinkedIn'
                } else if (data.source.indexOf('IndeedSponsored') > -1) {
                    data.source_type = 'Indeed.com Paid Ad'
                } else if (data.source.indexOf('Indeed') > -1) {
                    data.source_type = 'Indeed.com'
                } else if (data.source.indexOf('Craigslist') > -1) {
                    data.source_type = 'Craigslist'
                } else if (data.source.indexOf('SimplyHired') > -1) {
                    data.source_type = 'SimplyHired.com'
                } else if (data.source.indexOf('joelonsoftware') > -1) {
                    data.source_type = 'JoelOnSoftware'
                } else if (data.source_type == 'Friend -- External Referral' || data.source_type == 'Opower Friend -- External Referral') {
                    data.source_type = 'Employee';
                } else if (data.source.indexOf('jobvite') > -1) {
                    data.source_type = 'Jobvite';
                }

                if (data.source_type == 'Employee') {
                    data.source = data.source.replace(/-*,*\s*[^\s]*@.*$/, '');
                }

                if (data.source.indexOf('opower.com')  > -1) {
                    data.source_type = 'Opower.com'
                }

                if (data.source_type == 'Employee' && data.source.indexOf('"') > -1) {
                     data.source_type = 'Job Board';
                }

                if (data.source !== '' && data.source_type === '') {
                    data.source_type = 'Other Sources';
                }

                if (data.source.indexOf('opowerjobs ad') > -1) {
                    data.source_type = 'Employee';
                    data.source = data.source.substring('opowerjobs ad '.length);
                    data.source = data.source.replace(/-*,*\s*[^\s]*@.*$/, '');
                }

                if (data.source.indexOf('insider') > -1) {
                    data.source_type = 'Employee';
                    data.source = data.source.substring('insider '.length);
                    data.source = data.source.replace(/-*,*\s*[^\s]*@.*$/, '');
                }


                if (data.source_type == 'Employee' || data.source_type == 'Opower Employee') {
                    data.source = data.source.replace(/\s+/g, ' ').trim();
                    data.source_type = 'Employee Referral';
                }

                if (data.source.match(/Please input/)) {
                    data.source_type = 'Idiots';
                }

            }
            return data;
       }
    });
    log('Loading Candidates...');
    Reports.load(function(data) {
        if (!data) {
            log('NO CANDIDATES, WTF JOBVITE');
        } else {
            Cache.save('candidates.txt', JSON.stringify(data));
            callback(null, data);
        }
    });
}


function log_progress(callback) {
    if (in_progress) {
        var now = +new Date(),
            then = +in_progress,
            seconds = Math.round((now - then)/1000);
    if (seconds > 7200) { // two hour max
        log('Update was taking too long.');
        finished_update(callback);
    } else {
        seconds > 30 && log('update still in progress',  seconds, 'seconds');
        setTimeout(function(){ log_progress(callback);}, 10000); //every 10 seconds
        }
    }
}

module.exports.update = update;
module.exports.auto_update = auto_update;
module.exports.__defineGetter__('in_progress', function(){
        return in_progress;
    });
module.exports.__defineGetter__('last_updated', function(){
        return last_updated;
    });
