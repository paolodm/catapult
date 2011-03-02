var log = require('logging').from(__filename),
    //Dirty = require('./util/dirty'),
    //AuthLog = Dirty('./data/authlog.txt'),
    OpenID = require('openid');

//Spec:
//http://code.google.com/apis/accounts/docs/OpenID.html

//Sign out:
//https://www.google.com/accounts/b/1/IssuedAuthSubTokens

var extensions,
    callback_url,
    relying_party,
    Server;

var debug_auth = false;

function authenticate(req, res, next) {
    if (!debug_auth && Server.set('env') != 'production') {
        res.redirect('/verify');
        return;
    }

    relying_party.authenticate(
        'https://www.google.com/accounts/o8/site-xrds?hd=opower.com',
        false,
        function(authUrl) {
            res.redirect(authUrl);
        });
}

function verify(req, res, next) {
    if (!debug_auth && Server.set('env') != 'production') {
        req.session.email = 'dylan.greene@opower.com';
        req.session.name = 'Dylan Greene';
        req.session.first = 'dylan';
        req.session.last = 'greene';
        res.redirect('/welcome');
        return;
    }

    relying_party.verifyAssertion(req, function(result){
        if (!result.authenticated) {
            res.redirect('/auth');
        } else {
            var prefix = 'openid.ext1.value.';
            req.session.email = req.query[prefix + 'email'];
            req.session.name = req.query[prefix + 'firstname'] + ' ' + req.query[prefix + 'lastname'];
            req.session.first = req.query[prefix + 'firstname'];
            req.session.last = req.query[prefix + 'lastname'];
            log('Success!', req.session.name);
            res.redirect('/welcome');
        }
    });
}


function addHandlers(options) {
    Server = options.Server;
    Server.get('/verify', verify);
    Server.get('/auth', authenticate);

    if (debug_auth || Server.set('env') == 'production') {
        callback_url = (Server.set('env') == 'production' ? 'https://catapult.opower.com' : 'http://localhost:3300') + '/verify';

        extensions = [new OpenID.AttributeExchange(
                      {
                        "http://axschema.org/contact/email": "required",
                        "http://axschema.org/namePerson/first": "required",
                        "http://axschema.org/namePerson/last": "required"
                      })];

        relying_party = new OpenID.RelyingParty(
            callback_url, // Verification URL (yours)
            null, // Realm (optional, specifies realm for OpenID authentication)
            false, // Use stateless verification
            false, // Strict mode
            extensions); // List of extensions to enable and include
        }

}

module.exports.addHandlers = addHandlers;
