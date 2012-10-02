var log         = require('logging').from(__filename),
    Step        = require('step'),
    Cache       = require('../util/cache'),
    Lazy        = require('../util/lazy'),
    Constants   = require('../constants'),
    Update      = require('./update'),
    Format      = require('../util/format'),
    Mail        = require('../util/mail'),
    Status      = require('../util/status'),
    DB          = require('./db');

var DB_Candidates,
    DB_Jobs,
    DB_Employees;

var Faker = require('Faker'),
    useFake = false;



function update(callback) {
    Step(
        function() {
            var has_cache = Cache.exists('jobs.txt') && Cache.exists('candidates.txt');
            if (has_cache) {
                //log('Cache found, going to use it');
                this();
            } else {
                log('No data cached, I need to go download some.  This may take a few minutes.');
                Update.update(this);
            }
        },
        function() {
            Cache.load('jobs.txt', this);
        },
        function(err, raw_data) {
            err && log(err.stack, err);
            if (raw_data) {
                var data = JSON.parse(raw_data);
                jobs(data, this);
            }
            else {
                log('No jobs data found.  This is a bad thing.');
                this();
            }
        },
        function(err) {
            err && log(err.stack, err);

            Cache.load('candidates.txt', this);
        },
        function(err, raw_data) {
            err && log(err.stack, err);

            if (raw_data) {
                var data = JSON.parse(raw_data);
                candidates(data, this);
            }
            else {
                log('No candidate data found.  This is a bad thing.');
                this();
            }
        },
        function(err) {
            err && log(err.stack, err);
            employees(this);
        },
        function(err) {
            err && log(err.stack, err);

            if (DB_Candidates.size < 30000) {
                log('It seems jobvite is returning bad candidate data:', DB_Candidates.size);
            }
             else {
                DB.Candidates = Lazy(DB_Candidates);
            }

            if (DB_Employees.size < 40 || DB_Jobs.size < 300) {
                log('It seems jobvite is returning bad job data:', DB_Jobs.size);
            }
             else {
                DB.Jobs = Lazy(DB_Jobs);
                DB.Employees = Lazy(DB_Employees);
            }

            log('Current data...',
                    'Candidates:', DB.Candidates ? DB.Candidates.size : 'Broken',
                    'Employees:', DB.Employees ? DB.Employees.size : 'Broken',
                    'Jobs:', DB.Jobs ? DB.Jobs.size : 'Broken'
                    );

            DB.jobvite_down = !DB.Candidates || !DB.Employees || !DB.Jobs || DB.Candidates.size < 30000 || DB.Employees.size < 40 || DB.Jobs.size < 300;

            var notifications = require('./notifications');
            notifications.init({DB_Jobs: DB_Jobs});
            callback();
        });
}

function jobs(data, callback) {

    DB_Jobs = Lazy();

    data.forEach(function(job){
        if (job && job.id) {

            if (DB.ready) {
                var j = DB.Jobs.get(job.id);
                if (!j) {
                    log('New job', job.title);
                }
            }

            if (job.status != 'Draft') {
                DB_Jobs.set(job.id, job);
            } else {
                //log('Ignoring draft job', job.title, job.id);
            }
        }
    });

    callback && callback();
}

function candidates(data, callback) {

    DB_Candidates = Lazy();

    data.forEach(function(candidate){
        if (candidate && candidate.id) {
            if (useFake) {
                candidate.name = Faker.Name.firstName() + ' ' + Faker.Name.lastName();
            }

            if (DB.ready) {
                var c = DB.Candidates.get(candidate.id);
                if (!c) {
                    log('New candidate', candidate.name);
                } else if (c.status != candidate.status) {
                    log(c.name, c.status, '=>', candidate.status);
                }
            }

            candidate.search_source = ((candidate.source || '').replace(/[^a-zA-Z]/g, ' ').trim().replace(/\s+/g, ' ') + ' ' + candidate.source).toLowerCase();
            candidate.search_name = ((candidate.name).replace(/[^a-zA-Z]/g, ' ').trim().replace(/\s+/g, ' ') + ' ' + candidate.name).toLowerCase();

            var status = candidate.status;
            if (!Constants.STATUS_ORDER[status]) {
                log('unknown status', status, candidate.name);
                Constants.STATUS_ORDER[status] = { hide: true, owner: true, index: Object.keys(Constants.STATUS_ORDER).length  };
            }

            DB_Candidates.set(candidate.id, candidate);

            if (candidate.job_id) {
                var job = DB_Jobs.get(candidate.job_id);
                if (job) {
                    var candidates = job.candidates || [];
                    candidates.push(candidate.id);
                    job.candidates = candidates;
                    DB_Jobs.set(candidate.job_id, job);
                } else if (candidate.job_id != 'o-nV9Vfw6') {
                    //log('Candidate job is missing:', candidate.job_id, candidate.name);
                }
            }
        }
    });
    callback();
}



function employees(callback) {

    DB_Employees = Lazy();

    DB_Jobs.forEach(function(job_id, job){

        var active = false;

        if (job.candidates && job.candidates.length) {
            job.candidates.forEach(function(candidate_id){
                var candidate = DB_Candidates.get(candidate_id);
                var status = Constants.STATUS_ORDER[candidate.status];
                active = active || !status.hide || status.owner;
            });

            if (active) {

                job.recruiters.forEach(function(id){
                    if (id) {
                        var employee = DB_Employees.get(id) || {name: id, jobs: []};

                        employee.jobs.push(job.id);
                        employee.isRecruiter = true;
                        DB_Employees.set(id, employee);
                    }
                });

                job.managers.forEach(function(id){
                    if (id) {
                        var employee = DB_Employees.get(id) || {name: id, jobs: []};

                        employee.jobs.push(job.id);
                        employee.isManager = true;
                        DB_Employees.set(id, employee);
                    }
                });
            }
        }

    });

    callback && callback();
}

module.exports.update = update;