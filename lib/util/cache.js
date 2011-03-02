var fs = require('fs'),
    log = require('logging').from(__filename),
    directory = './data/';


function save(filename, data){
    var file = directory + filename;
    //log('writing to ' + file);
    try {
        fs.writeFileSync(file, data);
    } catch (err) {
        log('error writing file', err);
    }
}

function exists(filename) {
    var file = directory + filename;

    var result = true;
    try {
        fs.statSync(file);
    } catch(err) {
        result = false;
    }
    return result;
}

function load(filename, callback) {
    var file = directory + filename;

    //log('reading from cache: ' + file);

    fs.readFile(file, 'utf8', function(err, data){
        if (err) {
            log('error reading file', err.message);
            callback(err, false);
        } else {
            callback(null, data);
        }
    });

}
module.exports.exists = exists;
module.exports.save = save;
module.exports.load = load;