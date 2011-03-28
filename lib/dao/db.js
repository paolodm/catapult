var log =           require('logging').from(__filename),
    Organize =      require('./organize');

var Candidates,
    Employees,
    Jobs;

var ready = false,
    jobvite_down = false;

function init(cb){
    Organize.update(function(){
        ready = true;
        cb && cb();
    });
}

module.exports = {
    init:       init,
    Candidates: Candidates,
    Employees:  Employees,
    Jobs:       Jobs
};

module.exports.__defineGetter__('ready', function(){
    return ready;
});

module.exports.__defineGetter__('jobvite_down', function(){
    return jobvite_down;
});

module.exports.__defineSetter__('jobvite_down', function(value){
    jobvite_down  = value;
});

