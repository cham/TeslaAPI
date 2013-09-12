/*
 * queryBuilder
 * builds db queries for api methods
 */

var _ = require('underscore');

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
        'write:comments': function(query){
            query = query || {};

            return query;
        }
    },

    required: {
        getMissing: function(required, query){
console.log(query);
            return _(required).reduce(function(memo, val){
                if(_.isUndefined(query[val])){
                    memo.push(val);
                }
console.log(val, query[val], memo);
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
        }
    },

    sorting: {
        'read:threads': '-last_comment_time'
    },

    buildOptions: function(operationName, options, next){
        var cleanOptions = {},
            query,
            missingParams;
        
        options = options || {};
console.log(operationName, options);
        // build query
        query = this.mapping[operationName](options.query);
        missingParams = this.required[operationName] && this.required[operationName](query);

        if(missingParams && missingParams.length){
            return next(new Error('The following parameters are required: ' + missingParams));
        }
        cleanOptions.query = query;

        cleanOptions.sortBy = options.sortBy || this.sorting[operationName];
        if(!cleanOptions.sortBy){
            delete cleanOptions.sortBy;
        }

        next(null, cleanOptions);
    }

};