var Promise = require('bluebird');

var knex = require('knex')({
    client: 'mysql',
 //   debug: true,
    connection: {
      host : 'localhost',
      user : 'neotech2',
      password : 'neotech2',
      database : 'neotech2'
    }
});

var prepareEventData = function (event) {
    var event_record = {"id": event.id, 
        "date_event": new Date(event.date).toISOString().slice(0, 19).replace('T', ' ')};
    var scores = event.scores.split(":");
    var score_records = [];
    score_records[0] = {"event_id": event.id, "team_id": event.teams[0].id, "score": scores[0]};
    score_records[1] = {"event_id": event.id, "team_id": event.teams[1].id, "score": scores[1]};
    return {"event": event_record, "teams": event.teams, "scores": score_records};
}

var checkExistance = function(id, table) {
    return knex(table).select('id').where('id', id);
}

exports.getEventQuantity = function (trx) {
    if(trx) {
        return knex('event').select('id')
                            .transacting(trx)
                            .forShare();
    } else {
        return knex('event').select('id')
    }
    
}

var getEventForDelete = function (trx, limit) {
    return knex('event').select('id')
                        .transacting(trx)
                        .orderByRaw('RAND()')
                        .limit(limit)
                        .forUpdate();
}

exports.fetchPage = function (limit, offset) {
    return knex('event').select('date_event', 'event.id as main_id', 
                                knex.raw('GROUP_CONCAT(team.name ORDER BY team.id SEPARATOR \' - \') names'),
                                knex.raw('GROUP_CONCAT(score.score ORDER BY score.team_id SEPARATOR \':\') scores'))
                        .rightJoin('score', 'event.id', 'score.event_id')
                        .innerJoin('team', 'score.team_id', 'team.id')
                        .groupBy('main_id')
                        .limit(limit)
                        .offset(offset)
}

exports.fetchQuantity = function () {
    return knex('event').select('id')
}

exports.deletePercent = function (percent) {
    return knex.transaction(function(trx) {
        exports.getEventQuantity(trx)
            .then(function (res) {
                var quantityForDelete = Math.round(percent/100 * res.length);
                console.log(quantityForDelete);
                getEventForDelete(trx, quantityForDelete)
                    .then(function(rows){
                        return Promise.map(rows, function(row) {
                            return trx.from('score')
                                .where('event_id', row.id)
                                .del()
                                .then(function(res) {
                                    return trx.from('event').where('id', row.id).del()
                                        .then(function(res){
                                            console.log('Record deleted');
                                        },
                                        err => console.log(err))
                                });
                        });
                        
                    })
                    .then(trx.commit)
                    .catch(function(e){
                        console.log(e);
                        trx.rollback();
                    });
            });
    }).then(function(inserts) {
        console.log('success');
      })
      .catch(function(error) {
        console.error(error);
      });
};

exports.insertEvent = function (event) {
    var prepared = prepareEventData(event);
    console.log(prepared.event.id);
    return knex.transaction(function(trx) {
        checkExistance(prepared.event.id, 'event')
            .then(function(res) {
                console.log(res);
                if(typeof res !== 'undefined' && res.length > 0) {
                    console.log('Skips event #' + event.id);
                    throw Error('Event #' + event.id +' already exist')
                }
            
                return knex.insert(prepared.event)
                    .into('event')
                    .transacting(trx)
            })
            .then(function(res) {
                return Promise.map(prepared.teams, function(team){
                    return checkExistance(team.id, 'team').transacting(trx).then(function(res) {
                        if(typeof res !== 'undefined' && res.length > 0) {
                            console.log('Skips team #' + team.id);
                            return false;
                        }
                        return trx.insert(team).into('team').then(function(res) {
                            console.log('Successful inserting team #' + team.id + ' ' + team.name)
                        },
                        err => console.log(err)
                        )
                    });
                });
            })
            .then(function(res){
                var promises = [];
                prepared.scores.forEach(score => {
                    promises.push(trx.insert(score).into('score').then(function(res) {
                        console.log('Successful inserting score for event #' + score.event_id + ' ' + score.team_id)
                    },
                    err => console.log(err)
                    ));
                });
                return Promise.all(promises);
            })
            .then(trx.commit)
            .catch(trx.rollback);
        });
}