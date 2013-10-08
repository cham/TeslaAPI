/*
 * Tesla api methods for accessing and manipulating thread data
 */
var _ = require('underscore');

module.exports = function(db){
    return {
        findRange: function(query, done){
            if(!query.threadid) return done(new Error('threadid is required'));
            if(!query.skip) return done(new Error('skip is required'));

            db.threadRange.find(query).exec(function(err, range){
                if(err) return done(err);
                if(!_.isArray(range)) return done(new Error('Unknown range error'));

                return done(null, range[0]);
            });
        },
        setRange: function(options, done){
            var range = db.threadRange(options);

            range.save(function(err){
                if(err) return done(err);

                done(null, range);
            });
        },
        setStart: function(options){
            this.findRange({
                threadid: options.threadid,
                skip: options.skip
            }, function(err, range){
                if(err) return console.log(err);

                if(!range){
                    range = db.threadRange({
                        threadid: options.threadid,
                        skip: options.skip,
                        start_date: options.time
                    });
                }else{
                    range.start_date = options.time;
                }

                range.save(function(err){
                    if(err) console.log(err);
                });
            });
        },
        setEnd: function(options){
            this.findRange({
                threadid: options.threadid,
                skip: options.skip,
                limit: options.limit
            }, function(err, range){
                if(err) return console.log(err);

                if(!range){
                    return console.log(new Error('no matching range found'));
                }
                
                range.end_date = options.time;

                range.save(function(err){
                    if(err) console.log(err);
                });
            });
        },
        updatePartial: function(options){
            // db.threadRange({
            //     threadid: options.threadid
            // })
console.log('updatePartial', options);
        }
        /*
        getThreads: function(options, done){
            queryBuilder.buildOptions('read:threads', options, function(err, cleanOptions){
                if(err){
                    return done(err);
                }

                var totaldocs,
                    query = db.thread.find(cleanOptions.query);

                if(cleanOptions.countonly){
                    return query.count(function (err, count) {
                        if (err) return done(err);
                        
                        done(null, {
                            totaldocs: count
                        });
                    });
                }

                // count now takes longer than query for users
                async.parallel({
                    totaldocs: function(asyncDone){
                        _(query).clone().count(function (err, count) {
                            if (err) return asyncDone(null, 0);

                            asyncDone(null, count);
                        });
                    },
                    threads: function(asyncDone){
                        if(cleanOptions.sortBy){
                            query.sort(cleanOptions.sortBy);
                        }
                        if(cleanOptions.skip){
                            query.skip(cleanOptions.skip);
                        }
                        if(cleanOptions.limit){
                            query.limit(cleanOptions.limit);
                        }

                        // population only below here
                        if(cleanOptions.populate){
                            query.populate('comments');
                        }

                        query.exec(function(err, threads){
                            if(err) return asyncDone(null, []);

                            if(!threads || !threads.length){
                                return asyncDone(null, []);
                            }
                            if(cleanOptions.summary){
                                threads = _(threads).map(summaryMapping);
                            }
                            asyncDone(null, threads);
                        });
                    }
                }, function(err, results){
                    if(err) return done(err);

                    done(null,
                        {
                            threads: results.threads,
                            skip: cleanOptions.skip,
                            limit: cleanOptions.limit,
                            totaldocs: results.totaldocs
                        }
                    );
                });
            });
        }*/
    };
};