const express = require('express');
const app = express();
const dbh = require('./db.js');
const json_handler = require('./json_handler.js');
const index_path = '/public/html/index.html';
const json_path = '/data/events.json';
var io = require('socket.io').listen('8081');
var import_active = 0;
var page_size = 20;

Date.prototype.toJSON = function(){ return this.toISOString().slice(0, 19).replace('T', ' ') }

app.use('/static', express.static(__dirname + '/public'))

io.sockets.on('connection', function (socket) {
    progressSocket = function(percent) {
        socket.emit('message', percent);
    }
});


app.get('/', (req, res) => res.sendFile(__dirname + index_path))

app.get('/events', function (req, res) {
    dbh.fetchPage(page_size, 0).then(function(result) { 
        res.send(JSON.stringify(result))
    },
    err => console.log(err)
    );
});

app.get('/events/max_page', function (req, res) {
    dbh.getEventQuantity(null).then(function(result) {
        res.send(Math.floor(result.length/page_size).toString())
    },
    err => console.log(err)
    );
});

app.get('/events/:page', function (req, res) {
    var page = parseInt(req.params.page, 10);
    dbh.fetchPage(page_size, page_size*page).then(function(result) { 
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
                                    if(counter % 10 === 0) {
                                        console.log('Throttling');
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