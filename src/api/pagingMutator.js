/*
 * pagingMutator
 * singleton, which holds a record of recent queries performed and the created date of the head and tail of the results
 * if it has a match, then the skip and limit parameters are replaced with a date range
 * consider moving storage to a database, and not invalidating the cache?
 */
var _ = require('underscore');

function PagingMutator(){
    this.startRanges = {};
    this.endRanges = {};

    this.cachetime = 60*60*1000; // 1 hour
    this.cleantime = 30*1000; // 1 minute
}

// not very DRY but avoids key collision
PagingMutator.prototype.setRangeStart = function(queryOptions, val){
    this.startRanges[this.generateKey(queryOptions)] = {
        value: val,
        time: new Date()
    };
};

PagingMutator.prototype.setRangeEnd = function(queryOptions, val){
    this.endRanges[this.generateKey(queryOptions)] = {
        value: val,
        time: new Date()
    };
};

PagingMutator.prototype.getRangeStart = function(key){
    var cacheobj = this.startRanges[key];
    if(!cacheobj) return;
    return cacheobj.value;
};

PagingMutator.prototype.getRangeEnd = function(key){
    var cacheobj = this.endRanges[key];
    if(!cacheobj) return;
    return cacheobj.value;
};

PagingMutator.prototype.generateKey = function(queryOptions){
    return queryOptions.query.threadid + ':' + queryOptions.skip + ':' + queryOptions.limit;
};

PagingMutator.prototype.reduceClean = function(timestamp){
    var cachetime = this.cachetime;
    return function(memo, val, key){
        if((timestamp - val.time.getTime()) < cachetime){
            memo[key] = val;
        }
        return memo;
    };
};

PagingMutator.prototype.clean = function(){
    var now = (new Date()).getTime();
    this.startRanges = _(this.startRanges).reduce(this.reduceClean(now), {});
    this.endRanges = _(this.endRanges).reduce(this.reduceClean(now), {});
};

PagingMutator.prototype.mutate = function(queryOptions){
    var key = this.generateKey(queryOptions),
        start = this.getRangeStart(key),
        end = this.getRangeEnd(key);

    if(start){
        delete queryOptions.skip;
        queryOptions.query.created = {
            $gte: start
        };
    }
    if(end){
        delete queryOptions.limit;
        queryOptions.query.created = _(queryOptions.query.created || {}).extend({
            $lte: end
        });
    }

    return queryOptions;
};

var pagingMutator = new PagingMutator();

function cleanUp(){
    var size = _(pagingMutator.startRanges).size() + _(pagingMutator.endRanges).size(),
        sizeAfter,
        numremoved;

    console.log('cleaning ' + size + ' objects');
    
    pagingMutator.clean();
    sizeAfter = _(pagingMutator.startRanges).size() + _(pagingMutator.endRanges).size();

    numremoved = size - sizeAfter;
    console.log('clean complete, removed ' + numremoved + ' objects, new length is ' + sizeAfter);
    setTimeout(cleanUp, Math.ceil(pagingMutator.cleantime));
}
cleanUp();

module.exports = pagingMutator;