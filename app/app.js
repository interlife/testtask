const express = require('express');
const app = express();
const dbh = require('./db.js');
const json_handler = require('./json_handler.js');
const index_path = '/public/html/index.html';
const json_path = '/data/events.json';
var io = require('socket.io').listen('8081');
var import_active = 0;

Date.prototype.toJSON = function(){ return this.toISOString().slice(0, 19).replace('T', ' ') }

app.use('/static', express.static(__dirname + '/public'))

io.sockets.on('connection', function (socket) {
    progressSocket = function(percent) {
        socket.emit('message', percent);
    }
});


app.get('/', (req, res) => res.sendFile(__dirname + index_path))

app.get('/events', function (req, res) {
    dbh.fetchAll().then(function(result) { 
        res.send(JSON.stringify(result))
    },
    err => console.log(err)
    );
});

app.post('/events', function (req, res) {
    if(import_active) {
        res.status(429);
        res.send('Error. Import already started');
        return;
    }
    import_active = 1;
    json_handler.readFromFile(  __dirname + json_path, 
                                function(data, resume, counter) {
                                    dbh.insertEvent(data);
                                    if(counter % 1 == 0) {
                                        setTimeout(() => resume(), 1000)
                                    } else {
                                        resume();
                                    }
                                },
                                function() {
                                    import_active = 0;
                                },
                                function(progress) {
                                    progressSocket(progress);
                                }
    );
    
});

app.delete('/events/:percent', function (req, res) {
    var percent = parseInt(req.params.percent, 10);
    if(!percent) {
        res.status(500);
        res.send('Bad percent parameter');
    }
    dbh.deletePercent(req.params.percent);
    
});

app.listen(8080, () => console.log('listening on port 8080'))