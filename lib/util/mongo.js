/*
var log = require('logging').from(__filename),
    Step = require('step'),
    Mongoose = require('mongoose'),
    Schema = Mongoose.Schema,
    ObjectId = Schema.ObjectId;

setup();

var Candidate = Mongoose.model('Candidate');
//add_data();

show_data();

function setup(){

    Mongoose.connect('mongodb://localhost/catapult1');

    var Candidate = new Schema({
        id:         String,
        name:       String,
        friend:     ObjectId,
        friend2:     ObjectId
    });

    var Employee = new Schema({
        name:           String,
        isRecruiter:    Boolean,
        isManager:      Boolean
    });

    var Source = new Schema({
        source: String,
        sourceType: String
    });

    var Department = new Schema({
        name:   String
    });

    var Job = new Schema({
        jobId:      String,
        title:      String,
        department: ObjectId,
        recruiters: [ ObjectId ],
        managers:   [ ObjectId ]
    });

    var Application = new Schema({
        candidiate: ObjectId,
        job:        ObjectId,
        source:     ObjectId,
        status:     String,
        date:       Date
    });


    Mongoose.model('Candidate', Candidate);
    Mongoose.model('Job', Job);
}



function add_data() {
    log('test start');

    var data = {
        id: 1210,
        name: 'brock jones'
    };
 
    Candidate.findOne({ name: data.name}, function(err, doc) {
        if (!doc) {
            log('not found');
            var test = new Candidate(data);
            test.save(function(err) {
                log(err, 'saved', test.name); 
            });

        } else {
            log('found!', doc.name);
            Candidate.findOne({ name: 'bob smith'}, function(err, friend) {
                if(friend) {
                    log('found friend');
                    doc.set('friend', friend._id);

                    doc.save(function(err) {
                        log('updated friend', err);
                        show_data();
                    });
                }
            }); 
        }
    });
 
}


function show_data() {

    log('list all');

    Candidate.find({}, function (err, docs) {
        docs.forEach(function(doc){
            if (!doc.name) {
                doc.remove();
            }
            else {
                Step(
                    function () {
                        Candidate.findById(doc.friend, this.parallel());
                        Candidate.findById(doc.friend2, this.parallel());
                    },
                    function (err, friend1, friend2) {
                        log('friend 1', doc.name,' => ',  friend1 ? friend1.name : friend1);
                        log('friend 2', doc.name,' => ',  friend2 ? friend2.name : friend2);
                    }
                );
            }
        });
    });
}


module.exports = false;

        */