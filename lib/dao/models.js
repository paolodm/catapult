var log =       require('logging').from(__filename),
    Constants = require('../constants'),
    Format =      require('../util/format'),
    Update =    require('./update'),
    Sort =      require('./sort'),
    DB =        require('./db');

function init(options, cb){
    options = options || {};
    DB.init(function(){
        if (options.auto_update) {
            setTimeout(function(){
                Update.auto_update();
            }, Constants.MILLISECONDS_PER_MINUTE * 5);
        }
        cb && cb();
    });
}

function employees(options) {

    var data = [];
    DB.Employees.forEach(function(name, employee){

        if ((options.managers && !employee.isManager) || (options.recruiters && !employee.isRecruiter)) {
            return;
        }

        var statuses = Format.status_array(),
            count_candidates = 0,
            jobs = {};

        employee.jobs.forEach(function(job_id){

            var candidates = DB.Jobs.get(job_id).candidates;

            candidates && candidates.forEach(function(candidate_id){
                var candidate = DB.Candidates.get(candidate_id);

                if (!candidate) {
                    log('no candidate for id', candidate_id);
                    return;
                }
                if (!Constants.STATUS_ORDER[candidate.status]) {
                    log('Unknown status:', candidate.status, candidate);
                    return;
                }

                if (!Constants.STATUS_ORDER[candidate.status].hide) {
                    var status = candidate.status;
                    var days = Format.days(candidate.date);
                    var group = Format.threshold(days);
                    statuses[status]['count_' + group]++;
                    count_candidates++;
                    jobs[job_id] = true;
                }
            });

        });

        if (count_candidates > 0) {
            employee.statuses = statuses;
            employee.count_candidates = count_candidates;
            employee.count_jobs = Object.keys(jobs).length;

            data.push(employee);
        }
    });
    return data.sort(Sort.by_name);
}


function jobs(options) {
    options = options || {};
    var data = [];
    DB.Jobs.forEach(function(job_id, job){

        if (options.department && options.department != Format.url(job.department)) {
            return;
        }

        var statuses = Format.status_array(),
            count_candidates = 0;

            var candidates = job.candidates;

            candidates && candidates.forEach(function(candidate_id){
                var candidate = DB.Candidates.get(candidate_id);
                if (!Constants.STATUS_ORDER[candidate.status].hide) {
                    var index = candidate.status;
                    //if (index==0 ) { log('unknown status', candidate.status); }
                    var days = Format.days(candidate.date);
                    var group = Format.threshold(days);
                    statuses[index]['count_' + group]++;
                    count_candidates++;
                }
            });

        if (count_candidates > 0 || job.status == 'Open' ) {
            job.statuses = statuses;
            job.count_candidates = count_candidates;

            data.push(job);
        }
    });
    return data.sort(Sort.by_title);
}


function teams() {

    var departments = {};

    DB.Jobs.forEach(function(job_id, job){
        var department_id = job.department || 'No Department';
        var department = departments[department_id]
                || {
                    name:               department_id,
                    statuses:           Format.status_array(),
                    count_candidates:   0,
                    count_jobs:         0
                };

        var candidates = job.candidates;
        var count_candidates = 0;

        candidates && candidates.forEach(function(candidate_id) {
                var candidate = DB.Candidates.get(candidate_id);
                if (!Constants.STATUS_ORDER[candidate.status].hide) {
                    var index = candidate.status;
                    //if (index==0 ) { log('unknown status', candidate.status); }
                    var days = Format.days(candidate.date);
                    var group = Format.threshold(days);
                    department.statuses[index]['count_' + group]++;
                    count_candidates++;
                }
            });

        if (count_candidates > 0) {
            department.count_jobs++;
            department.count_candidates += count_candidates;
            departments[department_id] = department;
        }

    });
    return departments.map(function(department, id) {
        return department;
    }).sort(Sort.by_name);
}

function sources(options) {
    var sources = {};
    var start_date = Constants.TIMEFRAMES[options.when].start_date;
    var end_date = Constants.TIMEFRAMES[options.when].end_date || +new Date();

    if (start_date == 'month') {
        start_date = new Date();
        start_date.setDate(1);
    }

    if (start_date < 0) {
        start_date = (+new Date) + start_date;
    }

    //kicker: 1200 referals, 34 hires
    //after: 1050 referals, 35 hires
    DB.Candidates.forEach(function(candidate_id, candidate){
        if (candidate.source == '' || candidate.source_type == 'Import' || candidate.date_new < start_date || candidate.date_new > end_date) { return; }
        var source_id =  options.source_type ?
                            candidate.source :
                            candidate.source_type;

        if (options.source_type &&
                (Format.url(candidate.source_type) != options.source_type
                 || !source_id)) { return; }

        var source = sources[source_id.toLowerCase()]
                || {
                    name:               source_id,
                    sort_by:            source_id ? source_id.toLocaleUpperCase() : '',
                    statuses:           Format.status_array(),
                    count_candidates:   0,
                    count_active:       0,
                    count_hired:        0,
                    count_rejected:     0
                };
        if (!(Constants.STATUS_ORDER[candidate.status])) { return;}

        var days = Format.days(candidate.date);
        var group = Format.threshold(days);
        source.statuses[candidate.status]['count_' + group]++;

        source.count_candidates++;

        if (Constants.STATUS_ORDER[candidate.status].hired) {
            source.count_hired++;
        } else if (Constants.STATUS_INACTIVE[candidate.status]) {
            source.count_rejected++;
        } else {
            source.count_active++;
        }

        sources[source_id.toLowerCase()] = source;
    });
    return sources.map(function(source, id) {
                            return source;
                        }).sort(Sort.by_sort_by);
}

function employee(options) {

    var jobs = {},
        extra_jobs = {},
        statuses = Format.status_array();

    var employee = DB.Employees.url(options.employee);

    if (employee) {
        employee.jobs.forEach(function(job_id){
            var job = DB.Jobs.get(job_id),
                count_candidates = 0,
                count_hired = 0;
            job.candidates && job.candidates.forEach(function(candidate_id) {
                var candidate = DB.Candidates.get(candidate_id);
                var status = candidate.status;
                if (!Constants.STATUS_ORDER[status].hide
                        || Constants.STATUS_ORDER[status].hired
                        || (Constants.STATUS_ORDER[status].owner && (employee.name == options.session.name || options.session.isAdmin))) {
                    var days = Format.days(candidate.date);

                    if (Constants.STATUS_ORDER[status].hired || Constants.STATUS_ORDER[status].owner) {
                        count_hired++;
                    } else {
                        var group = Format.threshold(days);
                        statuses[status]['count_' + group]++;
                        candidate.group = group;
                        count_candidates++;
                    }
                    candidate.days = days;
                    if (!Constants.STATUS_INACTIVE[candidate.status]) {
                        candidate.applied_days = Format.days(candidate.date_new);
                    }
                    statuses[status].candidates.push(candidate);
                }
            });
            if (count_candidates > 0) {
                jobs[job_id] = job;
            }

            if (count_candidates === 0 && count_hired > 0) {
                extra_jobs[job_id] = job;
            }

        });

        statuses.forEach(function(status){
            status.candidates.sort(Sort.by_days);
        });
    } else {
        employee = {
            name: 'Unknown Person'
        };

    }

    return {
        employee:           employee,
        jobs:               jobs,
        extra_jobs:         extra_jobs,
        statuses:           statuses,
        page_title:         employee.name
    };
}

function department(options) {
    var jobs = {},
        department_name = '',
        statuses = Format.status_array();

    if (options.department) {
        DB.Jobs.forEach(function(id, job){
            if (options.department == Format.url(job.department)) {
                department_name = job.department;
                var total_candidates = 0;

                job.candidates && job.candidates.forEach(function(candidate_id) {
                    var candidate = DB.Candidates.get(candidate_id);
                    var status = candidate.status;
                    if (!Constants.STATUS_ORDER[status].hide) {
                        var days = Format.days(candidate.date);
                        var group = Format.threshold(days);
                        statuses[status]['count_' + group]++;
                        candidate.days = days;
                        candidate.group = group;
                        if (!Constants.STATUS_INACTIVE[candidate.status]) {
                            candidate.applied_days = Format.days(candidate.date_new);
                        }

                        statuses[status].candidates.push(candidate);
                        total_candidates++;
                    }
                });

                if (total_candidates > 0) {
                    jobs[job.id] = job;
                }

            }
        });
    }

    statuses.forEach(function(status){
        status.candidates.sort(Sort.by_days);
    });

    return {
        employee:           {},
        jobs:               jobs,
        statuses:           statuses,
        department_name:    department_name,
        page_title:         department_name
    };
}

function job(options) {

    var jobs = {},
        job_title,
        department_name,
        statuses = Format.status_array(),
        total_candidates = 0;

    if (options.job) {
        DB.Jobs.forEach(function(id, job){
            if (options.job == Format.url(job.title)) {

                job_title = job.title;
                department_name = job.department;

                var count_candidates = 0;

                job.candidates && job.candidates.forEach(function(candidate_id) {
                    var candidate = DB.Candidates.get(candidate_id);
                    var status = candidate.status;
                    if (!Constants.STATUS_ORDER[status].hide) {
                        var days = Format.days(candidate.date);
                        var group = Format.threshold(days);
                        statuses[status]['count_' + group]++;
                        candidate.days = days;
                        if (!Constants.STATUS_INACTIVE[candidate.status]) {
                            candidate.applied_days = Format.days(candidate.date_new);
                        }

                        candidate.group = group;
                        statuses[status].candidates.push(candidate);
                        total_candidates++;
                        count_candidates++;
                    }
                });

                if (count_candidates > 0) {
                    jobs[job.id] = job;
                }
            }
        });
    }

    statuses.forEach(function(status){
        status.candidates.sort(Sort.by_days);
    });

    return {
        employee:           {},
        jobs:               jobs,
        job_title:          job_title,
        page_title:         job_title,
        department_name:    department_name,
        statuses:           statuses,
        total_candidates:   total_candidates /* todo: if no canidates show a message? */
    };
}

/* for future fun */
function interesting_stats() {
    var oldest = 1262581200000,
        today = Math.round(((+new Date()) - oldest) / Constants.MILLISECONDS_PER_DAY),
        days = (new Array(today)).join('0 ').split(' ');


    DB.Candidates.forEach(function(candidate_id, candidate){

        var day = Math.round((candidate.date_new - oldest) / Constants.MILLISECONDS_PER_DAY);
        if (candidate.source != 'Direct  Upload') {
            if (days[day] == '0') { days[day] = 0; }
            days[day]++;
        }
    });

    for(var i=0; i < today; i++) {
        log(i, new Date(i*Constants.MILLISECONDS_PER_DAY + oldest), days[i]);
    }
    log('done', today);
}

function search(options) {

    var jobs = {},
        extra_jobs = {},
        candidates = [],
        rejected = [];

    var terms = Format.unurl(options.search_for).toLowerCase().split(' ');

    DB.Candidates.forEach(function(candidate_id) {
        var candidate = DB.Candidates.get(candidate_id);
        if (search_helper(candidate.search_name + ' '  + candidate.search_source, terms)) {
            var days = Format.days(candidate.date);
            var group = Format.threshold(days);
            var job = jobs[candidate.job_id];
            candidate.days = days;
            candidate.group = group;
            if (!Constants.STATUS_INACTIVE[candidate.status]) {
                candidate.applied_days = Format.days(candidate.date_new);
            }

            if (!Constants.STATUS_ORDER[candidate.status].rejected) {
                if (!job) {
                    job = DB.Jobs.get(candidate.job_id);
                    if (job) { jobs[candidate.job_id] = job; }
                }
            } else {
                if (!extra_jobs[candidate.job_id]) {
                    job = DB.Jobs.get(candidate.job_id);
                    if (job) { extra_jobs[candidate.job_id] = job; }
                }
            }

            if (!Constants.STATUS_ORDER[candidate.status].rejected && jobs[candidate.job_id]) {
                candidates.push(candidate);
            } else {
                rejected.push(candidate);
            }
        }
    });
        
    candidates.sort(Sort.by_days).reverse();
    rejected.sort(Sort.by_days).reverse();

    return {
        page_type:          Constants.PAGE_TYPE.search,
        query:              options.search_for,
        jobs:               jobs,
        extra_jobs:         extra_jobs,
        page_title:         options.search_for,
        candidates:         candidates,
        rejected:           rejected
    };
}

function referrals(search_for, session) {
    var terms       = Format.unurl(search_for).toLowerCase().split(' '),
        candidates  = [],
        jobs        = {};

    DB.Candidates.forEach(function(id, candidate){
        if (candidate.name != session.name && search_helper(candidate.search_source, terms)) {
            candidates.push(candidate);
            jobs[candidate.job_id] = DB.Jobs.get(candidate.job_id);
        }
    });

    return {
        candidates: candidates.sort(Sort.by_date),
        jobs:       jobs
    };

}

function search_helper(search_in, terms) {
    return terms[0].length && (search_in.indexOf(terms[0]) > -1) &&
        (!terms[1] || (terms[1] && search_in.indexOf(terms[1]) > -1)) &&
        (!terms[2] || (terms[2] && search_in.indexOf(terms[2]) > -1)) &&
        (!terms[3] || (terms[3] && search_in.indexOf(terms[3]) > -1));
}

function is_employee(name) {
    // Just make them employees if there's no employee db yet.
    return DB.Employees ? DB.Employees.get(name) : true;
}

function manual_update(cb) {
    Update.update(cb);
}

module.exports = {
    init:           init,
    sources:        sources,
    referrals:      referrals,
    employee:       employee,
    employees:      employees,
    teams:          teams,
    jobs:           jobs,
    job:            job,
    department:     department,
    search:         search,
    is_employee:    is_employee,
    manual_update:  manual_update,
    Format:         Format
};

module.exports.__defineGetter__('in_progress', function(){
        return Update.in_progress;
});

module.exports.__defineGetter__('last_updated', function(){
        return Update.last_updated;
});

module.exports.__defineGetter__('jobvite_down', function(){
        return DB.jobvite_down;
});