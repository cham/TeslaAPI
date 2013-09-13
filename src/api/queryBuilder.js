/*
 * queryBuilder
 * builds db queries for api methods
 */

var _ = require('underscore'),
    crypto = require('crypto');

var DEFAULTS = {
        setsize: 50,
        pagenum: 1
    };

function parseIntOrDefault(val, def){
    var n = parseInt(val, 10);
    if(isNaN(n)){
        return def;
    }
    return n;
}

module.exports = {

    mapping: {
        'read:threads': function(query){
            query = query || {};

            return query;
        },
        'write:threads': function(query){
            var now = new Date();
            query = query || {};

            return {
                name: query.name,
                urlname: encodeURIComponent(query.name.replace(/(\s-|[^A-Za-z0-9-])/g,'-')),
                postedby: query.postedby,
                categories: query.categories || [],
                created: now,
                last_comment_by: query.postedby,
                last_comment_time: now,
                comments: []
            };
        },
        'read:comments': function(query){
            query = query || {};

            return query;
        },
        'write:comments': function(query){
            var now = new Date();
            query = query || {};

            return {
                postedby: query.postedby,
                content: query.content,
                created: now,
                edit_percent: 0,
                points: 0
            };
        },
        'read:users': function(query){
            query = query || {};


            if(query.password){
                query.password = crypto
                                    .createHash("md5")
                                    .update(query.password)
                                    .digest("hex");
            }

            return query;
        },
        'write:users': function(query){
            var now = new Date();
            query = query || {};

            return {
                username: query.username,
                urlname: encodeURIComponent(query.username),
                password: crypto
                            .createHash("md5")
                            .update(query.password)
                            .digest("hex"),
                email: query.email,
                ip: query.ip,
                last_ip: query.ip,
                last_login: now,
                created: now,
                modified: now
            };
        }
    },

    required: {
        getMissing: function(required, query){
            return _(required).reduce(function(memo, val){
                if(_.isUndefined(query[val])){
                    memo.push(val);
                }
                return memo;
            }, []);
        },
        'write:threads': function(query){
            var required = ['name', 'postedby'];

            return this.getMissing(required, query);
        },
        'write:comments': function(query){
            var required = ['postedby', 'content'];

            return this.getMissing(required, query);
        },
        'write:users': function(query){
            var required = ['username', 'password', 'email', 'ip'];

            return this.getMissing(required, query);
        }
    },

    sorting: {
        'read:threads': '-last_comment_time'
    },

    buildOptions: function(operationName, options, next){
        var cleanOptions = {},
            sortBy = options.sortBy || this.sorting[operationName],
            query,
            missingParams;
        
        options = options || {};
        options.size = parseIntOrDefault(options.size, DEFAULTS.setsize);
        options.page = parseIntOrDefault(options.page, DEFAULTS.pagenum);

        // build query
        query = this.mapping[operationName](options.query);
        missingParams = this.required[operationName] && this.required[operationName](query);

        if(missingParams && missingParams.length){
            return next(new Error('The following parameters are required: ' + missingParams));
        }
        cleanOptions.query = query;

        // query modifiers
        if(sortBy){
            cleanOptions.sortBy = sortBy;
        }

        cleanOptions.limit = Math.max(0, options.size);
        if(cleanOptions.limit === 0){
            cleanOptions.limit = DEFAULTS.setsize;
        }
        cleanOptions.skip = Math.max(0, (options.page - 1) * (cleanOptions.limit || DEFAULTS.setsize));

        cleanOptions.summary = !!options.summary;
        cleanOptions.populate = !!options.populate;
        cleanOptions.countonly = !!options.countonly;

        next(null, cleanOptions);
    }

};