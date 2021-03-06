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

var prepareEventPackageData = function (package) {
    var result = {'events': [], 'teams':[], 'scores': []};
    package.forEach(function (row) {
        result.events.push({'id': row.id, 
            'date_event': new Date(row.date).toISOString().slice(0, 19).replace('T', ' ')});
        result.teams.push(row.teams);
        var scores = row.scores.split(":");
        result.scores.push({"event_id": row.id, "team_id": row.teams[0].id, "score": scores[0]});
        result.scores.push({"event_id": row.id, "team_id": row.teams[1].id, "score": scores[1]});
    })
    return result;
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
    return knex.transaction(async function(trx) {
        try {
            let all_events = await exports.getEventQuantity(trx);
            var quantity_delete = Math.round(percent/100 * all_events.length);
            let marked_rows = await getEventForDelete(trx, quantity_delete);
            await Promise.map(marked_rows, async function(row) {
                await trx.from('score').where('event_id', row.id).del();
                await trx.from('event').where('id', row.id).del()
            });
        } catch (err) {
            trx.rollback();
            console.log(err);
            throw err;
        }
    });
};

exports.insertEventPackage = function (package) {
    var prepared = prepareEventPackageData(package);
    return knex.transaction(async function (trx) 
    {
        try {
            let inserted_teams = await Promise.map(prepared.teams, function(team){
                return trx.raw(knex('team').insert(team).toString().replace('insert', 'INSERT IGNORE'));
            });
            let inserted_events = await Promise.map(prepared.events, function(event){
                return trx.raw(knex('event').insert(event).toString().replace('insert', 'INSERT IGNORE'));
            });
            let inserted_scores = await Promise.map(prepared.scores, function(score){
                return trx.raw(knex('score').insert(score).toString().replace('insert', 'INSERT IGNORE'));
            });
        } catch (err) {
            trx.rollback();
            console.log(err);
            throw err;
        }
    });
}