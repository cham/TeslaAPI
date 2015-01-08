/*
 * Tesla api methods for accessing and manipulating thread data
 */
var _ = require('underscore');

module.exports = function(db){
    return {
        findRange: function(query, done){
// console.log('findRange', query);
            if(!query.threadid) return done(new Error('threadid is required'));
            if(!_.isNumber(query.skip)) return done(new Error('skip is required'));

            db.threadRange.find(query).exec(function(err, range){
                if(err) return done(err);
                if(!_.isArray(range)) return done(new Error('Unknown range error'));

                return done(null, range[0]);
            });
        },
        setRange: function(options, done){
// console.log('setRange', options);
            this.findRange({
                threadid: options.threadid,
                skip: options.skip,
                limit: options.limit
            }, function(err, range){
                if(err) return done(err);
                if(range) return done(null, range);

                range = db.threadRange(options);

                range.save(function(err){
                    if(err) return done(err);

                    done(null, range);
                });
            });
        },
        updatePartial: function(options){
            db.threadRange.find({
                threadid: options.threadid,
                partial: true
            }).exec(function(err, ranges){
                if(err) return;

                _(ranges).each(function(range){
                    range['length']++;
                    range.partial = (range['length'] !== range.limit);
                    range.end_date = new Date();

                    range.save();
                });
            });
        }
    };
};