/*!
 * OPOWER Jobs
 * Copyright(c) 2010 Dylan Greene <dylang@gmail.com>
 * MIT Licensed
 */

var log = require('logging').from(__filename),
    Asset_Manager = require('connect-assetmanager'),
    Asset_Handler = require('connect-assetmanager-handlers'),
    compress = true,
    build,

    css = [
            'css/reset.css',
            'css/base.css',
            'js/datatables/dataTables.css',
            'css/css3buttons/css3buttons.css',
            'css/isotope.css',
            'css/nav.css',
            'css/colors.css',
            'css/swimlanes.css',
            'css/candidate.css',
            'css/req.css'
         ],

    js = [
            'js/jquery/jquery.js',
            'js/jquery/jquery.doTimeout.js',
            'js/jquery/jquery.isotope.js',
            'js/jquery/jquery.store.js',
            'js/jquery/jquery.highlight.js',
            'js/jquery/jquery.flextarea.js',
            'js/jquery/jquery.noisy.js',
            'js/jqueryui/js/jquery-ui-1.8.9.custom.js',
            'js/datatables/jquery.dataTables.js',
            'js/datatables/FixedHeader.js',
            'js/datatables/FixedHeader.js',
            'js/datatables/ColReorder.js',
            'js/catapult.js',
            'js/search.js',
            'js/tables.js',
            'js/filtering.js',
            'js/candidate.js',
            'js/req.js'
        ];

function config() {
    return {
        css: {
            route: /[0-9]+\/compressed\.css/,
            path: './public/',
            dataType: 'css',
            debug: true,
            files: css
        },
        js: {
            route: /[0-9]+\/compressed\.js/,
            path: './public/',
            dataType: 'javascript',
            debug: false,
            files: js,
            postManipulate: {
                '^': [
                    //Asset_Handler.uglifyJsOptimize
                ]
            }
        }
    };
}

function styles(options) {

    if (compress || options.compress) {
        return '<link href="/' + build + '/compressed.css" rel="stylesheet" type="text/css"/>';
    }

    var out = [], cacheBuster = ''; //'?' + Math.round(Math.random() * build);
    css.forEach(function(file) {
        out.push('<link href="/' + file + cacheBuster + '" rel="stylesheet" type="text/css"/>');
    });
    return out.join('\n');
}

function scripts(options) {
    if (compress || options.compress) {
        return '<script type="text/javascript" src="/' +  build + '/compressed.js"></script>';
    }

    var out = [], cacheBuster = '';
    js.forEach(function(file) {
        out.push('<script type="text/javascript" src="/' + file + cacheBuster + '"></script>');
    });
    return out.join('\n');
}

function set_build() {
    build = +(new Date());
}

function addHandler(options) {
    var Server = options.Server;
    set_build();
    compress = false; //Server.set('env') == 'production';

    Server.dynamicHelpers({
        styles: function(req) {
            return styles({compress: ('compress' in req.query)});
        },
        scripts: function(req) {
            return scripts({compress: ('compress' in req.query)});
        }
    });

    //Server.use(Asset_Manager(config()));
}

module.exports = {
    addHandler: addHandler
};