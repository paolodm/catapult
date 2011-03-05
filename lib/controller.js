var log         = require('logging').from(__filename),
    DAL         = require('./dao/models'),
    Auth        = require('./auth'),
    Constants   = require('./constants'),
    Format      = require('./util/format'),
    Server;

function home(req, res, next) {
    res.render('home.ejs');
}

function authRequired(req, res, next) {
    if (!req.session.email || req.session.email.indexOf('@opower.com') === -1 ) {
        req.session.email = false;
        req.session.returnUrl = req.url;
        log(req.url);
        res.redirect('/auth');
    } else {
        next();
    }
}

function guestRequired(req, res, next) {
    if (req.session.email && req.session.email.indexOf('@opower.com') != -1 ) {
        res.redirect('/welcome');
    } else {
        next();
    }
}

function welcome(req, res, next) {
    var new_url;

    var employee = req.session && DAL.is_employee(req.session.name);
    req.session.isManager = employee ? !!employee.isManager : false;
    req.session.isRecruiter = employee ? !!employee.isRecruiter  : false;
    req.session.isAdmin = Constants.ADMIN_LIST[req.session.name] || false;

    if (req.session.returnUrl) {
        new_url = req.session.returnUrl;
        delete req.session.returnUrl;
    } else if (req.session.isRecruiter) {
        req.session.home_page = new_url = '/recruiters/' + Format.url(req.session.name);
    } else if (req.session.isManager) {
        req.session.home_page = new_url = '/managers/' + Format.url(req.session.name);
    } else {
        new_url = '/search/' + Format.url(req.session.name);
    }
    log(req.session.name, (req.session.isManager ? 'Manager ' : '') + (req.session.isRecruiter ? 'Recruiter ' : '') + (req.session.isRecruiter ? 'Admin' : ''), new_url);
    res.redirect(new_url);
}

function referrals(req, res, next) {
    var results = {},
        query = req.params.q || req.query.q;

    if (query) {
        query = query.toLowerCase()
                .trim()
                .replace(/-/g, ' ')
                .replace(/   /g, ' - ');

        results = DAL.referrals(query, req.session);

        res.render('referrals.ejs', {
            query:          query,
            page_title:     query,
            results:        results
         });
    } else {
        res.redirect('/referrals/' + Format.url(req.session.name));
    }

}


function sources(req, res, next) {
    var time_frame = Format.timeframe(req.query.when);
    var options = {
        when:           time_frame
    };

    res.render('table.ejs', {
        page_title:             'Sources',
        collection:             DAL.sources(options),
        page_type:              Constants.PAGE_TYPE.sources,
        options:                options
    });
}

function source(req, res, next) {
    var source_type = req.params.source_type;
    var time_frame = Format.timeframe(req.query.when);
    var options = {
        when:           time_frame,
        source_type:    source_type
    };

    res.render('table.ejs', {
        page_title:         'Source: ' + Format.unurl(source_type),
        collection:         DAL.sources(options),
        page_type:          Constants.PAGE_TYPE.source,
        options:            options
    });
}

function recruiters(req, res, next) {
    var options = { recruiters: true};

    res.render('table.ejs', {
        page_title:         'Recruiters',
        collection:         DAL.employees(options),
        page_type:          Constants.PAGE_TYPE.recruiters,
        options:            options
    });
}

function managers(req, res, next) {
    var options = { managers: true};

    res.render('table.ejs', {
        page_title:         'Hiring Managers',
        collection:         DAL.employees(options),
        page_type:          Constants.PAGE_TYPE.managers,
        options:            options
    });
}

function teams(req, res, next) {
    res.render('table.ejs', {
        page_title:         'Teams',
        collection:         DAL.teams(),
        page_type:          Constants.PAGE_TYPE.teams
    });
}

function jobs(req, res, next) {
    res.render('table.ejs', {
        page_title:         'Reqs',
        collection:         DAL.jobs(),
        page_type:          Constants.PAGE_TYPE.jobs
    });
}

function employee(req, res, next) {
    res.render('swimlanes.ejs', DAL.employee({employee: req.params.employee, session: req.session}));
}

function job(req, res, next) {
    res.render('swimlanes.ejs', DAL.job({job: req.params.job}));
}

function team(req, res, next) {
    res.render('swimlanes.ejs', DAL.department({department: req.params.team}));
}

function update(req, res, next){
    DAL.manual_update();
    res.send('updating');
}

function logout(req, res, next) {
    req.session.regenerate(next);
}

function new_req(req, res, next) {

    //log(req.query, Object.keys(req));

    var instructions = 'This is your interactive instruction guide.\n'
                        + '\n'
                        + ' - Bulleted lists are created by starting a line with space, hyphen, space.\n'
                        + ' - Tip: Make sure there is a blank line between paragraph text and bulleted list.\n'
                        + ' - Tip: Make sure you end each item with a period.\n'
                        + ' - Each section can contain text and/or bullets.\n'
                        + ' - Need something in bold?  You can but it can be **distracting**.\n'
                        + ' - Need a link?  Here\'s the syntax: [OPOWER Jobs](http://opowerjobs.com/).';

    var default_position = '',
        default_team = '',
        default_you = '';

    var new_req = {
        position: req.query.position || default_position,
        team: req.query.team || default_team,
        you: req.query.you || default_you
    };
    res.render('req.ejs', {
        req: new_req,
        instructions: instructions,
        Markdown: Format.markdown,
        page_title: 'New Req'
    });
}

function markdown(req, res, next) {
    res.send(Format.markdown(req.query.text));
}

function show_log(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'text/plain'} );
    log.history().forEach(function(data){
        res.write(data.niceTime + ' ');
        res.write('[' + data.file);
        res.write((data.func ?  ':' + data.func  : '') + '] ');
        data.messages.forEach(function(message) {
            res.write(message + ' ');
        });
        res.write('\n');
    });
    res.end();
}

function old_search(req, res, next) {
    res.redirect('/referrals/' + (req.params.q || req.query.q || ''));
}

function addHandlers(options) {
    Server = options.Server;

    Auth.addHandlers({Server: Server});

    Server.get('/', guestRequired, home);
    Server.get('/welcome', welcome);
    Server.get('/log', authRequired, show_log);

    Server.get('/logout', logout);

    Server.get('/search/:q?', authRequired, old_search);
    Server.get('/referrals/:q?', authRequired, referrals);

    Server.get('/sources', authRequired, sources);
    Server.get('/sources/:source_type', authRequired, source);

    Server.get('/recruiters', authRequired, recruiters);
    Server.get('/recruiters/:employee', authRequired, employee);

    Server.get('/managers', authRequired, managers);
    Server.get('/managers/:employee', authRequired, employee);

    Server.get('/jobs', authRequired, jobs);
    Server.get('/jobs/:job', authRequired, job);

    Server.get('/teams', authRequired, teams);
    Server.get('/teams/:team', authRequired, team);

    Server.get('/req', authRequired, new_req);
    Server.get('/md', authRequired, markdown);

    Server.get('/update', authRequired, update);

    Server.locals({
        url:        Format.url,
        options:    {},
        has_ticks:  false,
        has_mini:   false,
        Constants:  Constants
    });
    Server.dynamicHelpers({
        session: function(req, res){
            return req.session;
        },
        current_url: function(req, res){
            return req.url;
        },
        in_progress: function() {
            return DAL.in_progress;
        },
        last_updated: function() {
            return DAL.last_updated;
        }
    });

    DAL.init({ auto_update: Server.set('env') == 'production'});
}

module.exports.addHandlers = addHandlers;
