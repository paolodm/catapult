var log = require('logging').from(__filename);

function by_sort_by(a, b) {
    if (a.sort_by > b.sort_by) return 1;
    if (a.sort_by < b.sort_by) return -1;
    return 0;
}


function by_name(a, b) {
    if (a.name > b.name) return 1;
    if (a.name < b.name) return -1;
    return 0;
}

function by_title(a, b) {
    if (a.title > b.title) return 1;
    if (a.title < b.title) return -1;
    return 0;
}

function by_date(a, b) {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return by_name(a,b);
}

function by_days(a, b) {
    if (a.days > b.days) return -1;
    if (a.days < b.days) return 1;
    return 0;

}

module.exports.by_sort_by = by_sort_by;
module.exports.by_name = by_name;
module.exports.by_title = by_title;
module.exports.by_date = by_date;
module.exports.by_days = by_days;