const express = require('express');
const app = express();
const dbh = require('./db.js');
const index_path = '/public/html/index.html';

Date.prototype.toJSON = function(){ return this.toISOString().slice(0, 19).replace('T', ' ') }

app.use('/static', express.static(__dirname + '/public'))

app.get('/', (req, res) => res.sendFile(__dirname + index_path))

app.get('/events', function (req, res) {
    dbh.fetchAll().then(function(result) { 
        res.send(JSON.stringify(result))
    },
    err => console.log(err)
    );
});

app.post('/events', function (req, res) {
    //var test = {"id":1,"date":"2015-11-10T20:00:00.566Z","teams":[{"id":36,"location":"Miami","name":"Dolphins"},{"id":21,"location":"Kansas City","name":"Royals"}],"scores":"0:4"};
    //dbh.insertEvent(test);
});

app.listen(8080, () => console.log('listening on port 8080'))