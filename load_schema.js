var knex = require('knex')({
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'neotech2',
      password: 'neotech2',
      database: 'neotech2',
    },
});

knex.schema.createTable('event', function(table) {
    table.integer('id').primary();
    table.dateTime('date_event');
}).then(function(response) {
    console.log('Ok event');
  })
  .catch(function(err) { console.log(err); });

knex.schema.createTable('team', function(table) {
    table.integer('id').primary();
    table.string('name');
    table.string('location');
}).then(function(response) {
    console.log('Ok team');
  })
  .catch(function(err) { console.log(err); });

knex.schema.createTable('score', function(table) {
    table.increments('id');
    table.integer('event_id');
    table.foreign('event_id').references('event.id').onDelete('CASCADE');
    table.integer('team_id');
    table.foreign('team_id').references('team.id').onDelete('RESTRICT');
    table.integer('score');
}).then(function(response) {
    console.log('Ok score');
  })
  .catch(function(err) { console.log(err); });

knex.schema.alterTable('score', function(t) {
    t.unique(['event_id', 'team_id']);
}).then(function(response) {
    console.log('Ok unique');
  })
  .catch(function(err) { console.log(err); });
