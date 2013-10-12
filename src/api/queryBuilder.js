/*
 * queryBuilder
 * builds db queries for api methods
 */

var _ = require('underscore'),
    bcrypt = require('bcrypt'),
    pagingMutator = require('./pagingMutator');

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
        clean: function(query){
            return _(query).reduce(function(memo, val, key){
                if(!_.isUndefined(val)){
                    memo[key] = val;
                }
                return memo;
            },{});
        },
        'read:threads': function(query){
            query = query || {};

            if(query.name){
                query.name = new RegExp(query.name, 'i');
            }

            return this.clean({
                categories: query.categories,
                name: query.name,
                urlname: query.urlname,
                _id: query._id,
                postedby: query.postedby
            });
        },
        'write:threads': function(query){
            var now = new Date();
            query = query || {};

            return this.clean({
                name: query.name,
                urlname: encodeURIComponent(query.name.replace(/(\s-|[^A-Za-z0-9-])/g,'-')),
                postedby: query.postedby,
                categories: query.categories || [],
                created: now,
                last_comment_by: query.postedby,
                last_comment_time: now,
                comments: []
            });
        },
        'read:comments': function(query){
            query = query || {};

            return this.clean({
                _id: query._id,
                threadid: query.threadid,
                postedby: query.postedby
            });
        },
        'write:comments': function(query){
            var now = new Date();
            query = query || {};

            return this.clean({
                threadid: query.threadid,
                postedby: query.postedby,
                content: query.content,
                created: now,
                edit_percent: 0,
                points: 0
            });
        },
        'read:messages': function(query){
            query = query || {};

            return this.clean({
                _id: query._id,
                recipient: query.recipient,
                sender: query.sender,
                read: query.read,
                recipient_deleted: query.recipient_deleted,
                sender_deleted: query.sender_deleted
            });
        },
        'write:messages': function(query){
            query = query || {};

            return this.clean({
                _id: query._id,
                sender: query.sender,
                recipient: query.recipient,
                subject: query.subject,
                content: query.content,
                created: new Date()
            });
        },
        'update:messages': function(query){
            query = query || {};

            return this.clean({
                sender: query.sender,
                recipient: query.recipient
            });
        },
        'read:users': function(query){
            query = query || {};

            return this.clean({
                username: query.username,
                password: query.password
            });
        },
        'write:users': function(query){
            var now = new Date();
            query = query || {};

            return this.clean({
                username: query.username,
                urlname: encodeURIComponent(query.username),
                password: bcrypt.hashSync(query.password, bcrypt.genSaltSync(12)),
                email: query.email,
                ip: query.ip,
                last_ip: query.ip,
                last_login: now,
                created: now,
                modified: now,
                participated: [],
                favourites: [],
                hidden: []
            });
        },
        'update:users': function(query){
            query = query || {};

            return this.clean({
                username: query.username
            });
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
            var required = ['threadid', 'postedby', 'content'];

            return this.getMissing(required, query);
        },
        'write:users': function(query){
            var required = ['username', 'password', 'email', 'ip'];

            return this.getMissing(required, query);
        },
        'update:users': function(query){
            var required = ['username'];

            return this.getMissing(required, query);
        },
        'write:messages': function(query){
            var required = ['sender', 'recipient', 'subject', 'content'];

            return this.getMissing(required, query);
        }
    },

    sorting: {
        'read:threads': '-last_comment_time',
        'read:comments': 'created',
        'read:messages': '-created'
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

        // user list updating
        cleanOptions.listkey = options.listkey;
        cleanOptions.listval = options.listval;
        cleanOptions.removefromlist = !!options.removefromlist;

        // array of ids
        if(_.isArray(options.ids)){
            cleanOptions.query._id = { $in: options.ids };
        }

        // distinct
        cleanOptions.distinctkey = options.distinctkey;

        // clean
        cleanOptions = this.mapping.clean(cleanOptions);

        // mutate paging for comments
        if(operationName === 'read:comments'){
            cleanOptions = pagingMutator.mutate(cleanOptions, function(mutatedOptions){
                next(null, mutatedOptions);
            });
        }else{
            next(null, cleanOptions);
        }
    }

};