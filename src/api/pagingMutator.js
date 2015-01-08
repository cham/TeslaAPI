/*
 * pagingMutator
 * singleton, which holds a record of recent queries performed and the created date of the head and tail of the results
 * if it has a match, then the skip and limit parameters are replaced with a date range
 * most of this logic is now handled by the threadsRangeApi and mongo table for persistence
 */
var _ = require('underscore'),
    db = require('../db/db'),
    threadsRange = require('./threadsRange'),
    threadsRangeApi = threadsRange(db);

function PagingMutator(){
}

PagingMutator.prototype.mutate = function(queryOptions, done){
    return done(queryOptions);
    threadsRangeApi.findRange({
        threadid: queryOptions.query.threadid,
        skip: queryOptions.skip
    }, function(err, range){
        if(err || !range) return done(queryOptions);

        if(range.start_date){
            delete queryOptions.skip;
            queryOptions.query.created = {
                $gte: range.start_date
            };
        }
        if(range.end_date){
            queryOptions.skip = 0;
            queryOptions.query.created = _(queryOptions.query.created || {}).extend({
                $lte: range.end_date
            });
        }

        done(queryOptions);
    });
};

var pagingMutator = new PagingMutator();

module.exports = pagingMutator;
