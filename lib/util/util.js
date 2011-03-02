var log = require('logging').from(__filename),
    Constants = require('../constants'),
    Markdown = require('markdown-js');


function titleCase(str) {
    return str ? str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
}

function fix_all_caps(str) {
    if (str == str.toUpperCase()) {
        str = titleCase(str);
    }
    return str;
}


function getId(str) {
    str = str || '';
    var match = str.match(/\?[^=]*=([^"]*)"/);
    if (!match || match.length < 1) {
        //log('getid match error', str, match);
        return false;
    }
    return match[1];
}

function people(str) {
    str = str || '';
    return str.length ? str.split('<br>') : false;
}

function removeHTML(data){
    data = data || '';
    
    return data.replace(/<([^>]*)>/g, '');
}

function next(p) {
    return function(arg) {
    p(null, arg);
    }
}

function fix_source(source) {
    if (source) {
        source = source
                .trim()
                .replace('Via: Direct', '')
                .replace('Via: ', '')
                .replace('Service: ', '');

        var uriStart = source.indexOf('http://');
        var uriEnd = source.indexOf(',', uriStart);
        if (uriStart > -1) {
            var uri = source.substr(uriStart, uriEnd > -1 ? uriEnd - uriStart: 999);
            source = source.substr(0, uriStart)
                    + '<a class="external" target="_blank" href="' + uri + '">'
                    + uri.substr( uri.indexOf('http://www.') > -1 ? 11 : 7)
                    + '</a>';
        }
    }

    source = source
                .replace(/[,"]*$/g, '')
                .replace(/^[,";]*/g, '')
                .replace(/\(.*\)/, '')
                .trim();
    return source;
}


function status_array () {
    var statuses = {};
     Constants.STATUS_ORDER.forEach(function(value, key){
        statuses[key] = {
            index:          value.index,
            status:         key,
            hide:           !!value.hide,
            count_low:      0,
            count_medium:   0,
            count_high:     0,
            candidates:     []

        };
    });
    return statuses;
}

function days(ms)  {
    return ms ? Math.ceil((Date.now()-ms)/Constants.MILLISECONDS_PER_DAY) : '';
}

function hours(ms) {
    return Math.floor(
            (Date.now() - (ms))/Constants.MILLISECONDS_PER_HOUR * 10
           )/10;
}

function minutes(ms) {
    return Math.floor(
            (Date.now() - (ms))/Constants.MILLISECONDS_PER_MINUTE
           );
}


function threshold(days) {
    return days < Constants.THRESHOLDS.low
            ? 'low'
            : days < Constants.THRESHOLDS.medium
                ? 'medium'
                : 'high';
}

function timeframe (query) {
    var timefame = 'All Time';
    Constants.TIMEFRAMES.forEach(function(value, id) {
        if (url(id) == query) {
            timefame = id;
        }
    });
    return timefame;
}

function url(s) {
    s = s || '';
    s = s.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
    return s;
}

function unurl(s) {
    return s.replace(/\-/g, ' ');
}


function markdown(str) {
    return Markdown.parse(str);
}

module.exports = {
    titleCase:              titleCase,
    fix_all_caps:           fix_all_caps,
    getId:                  getId,
    people:                 people,
    removeHTML:             removeHTML,
    next:                   next,
    fix_source:             fix_source,
    status_array:           status_array,
    days:                   days,
    hours:                  hours,
    minutes:                minutes,
    threshold:              threshold,
    timeframe:              timeframe,
    url:                    url,
    unurl:                  unurl,
    markdown:               markdown
};
