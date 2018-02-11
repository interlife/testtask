var knex = require('knex')({
    client: 'mysql',
    connection: {
      host : 'localhost',
      user : 'neotech',
      password : 'neotech',
      database : 'neotech'
    }
});

var prepareEventData = function (event) {
    var event_record = {"id": event.id, 
        "date_event": new Date(event.date).toISOString().slice(0, 19).replace('T', ' ')};
    var scores = event.scores.split(":");
    var score_records = [];
    score_records[0] = {"event_id": event.id, "team_id": event.teams[0].id, "score": scores[0]};
    score_records[1] = {"event_id": event.id, "team_id": event.teams[1].id, "score": scores[1]};
    console.log(event.teams);
    return {"event": event_record, "teams": event.teams, "scores": score_records};
}

exports.fetchAll = function () {
    return knex('event').select('date_event', 'event.id as main_id', 
                                knex.raw('GROUP_CONCAT(team.name ORDER BY team.id SEPARATOR \' - \') names'),
                                knex.raw('GROUP_CONCAT(score.score ORDER BY score.team_id SEPARATOR \':\') scores'))
                        .rightJoin('score', 'event.id', 'score.event_id')
                        .innerJoin('team', 'score.team_id', 'team.id')
                        .groupBy('main_id')
}
//todo: проверка на дублирование
exports.insertEvent = function (event) {
    var prepared = prepareEventData(event);
    knex('event').insert(prepared.event).then(
        function(res) {
            console.log('Successful inserting event #' + prepared.event.id)
        },
        err => console.log(err)
    )

    prepared.teams.forEach(team => {
        knex('team').insert(team).then(
            function(res) {
                console.log('Successful inserting team #' + team.id + ' ' + team.name)
            },
            err => console.log(err)
        )
    });

    prepared.scores.forEach(score => {
        knex('score').insert(score).then(
            function(res) {
                console.log('Successful inserting score for event #' + score.event_id + ' ' + score.event_team)
            },
            err => console.log(err)
        )
    });
}