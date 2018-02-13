const express = require('express');
const app = express();
const dbh = require('./db.js');
const fetch_cache = require('./fetch_cache');
const json_handler = require('./json_handler.js');
const index_path = '/public/html/index.html';
const json_path = '/data/events.json.gz';
var io = require('socket.io').listen('8081');
var import_active = 0;
var page_size = 20;

app.use('/static', express.static(__dirname + '/public'))

io.sockets.on('connection', function (socket) {
    progressSocket = function(percent) {
        socket.emit('message', percent);
    }
});


app.get('/', (req, res) => res.sendFile(__dirname + index_path))

app.get('/events', function (req, res) {
    fetch_cache.fetchPageCached(page_size, 0, (result) => {
        res.send(result)
    });
});

app.get('/events/max_page', function (req, res) {
    fetch_cache.getEventQuantity(function(result) {
        res.send(Math.floor(result/page_size).toString())
    });
});

app.get('/events/saved', function (req, res) {
    fetch_cache.getEventQuantity(function(result) {
        res.send(result.toString())
    });
});

app.get('/events/:page', function (req, res) {
    var page = parseInt(req.params.page, 10);
    fetch_cache.fetchPageCached(page_size, page_size*page, (result) => {
        res.send(result)
    });
});

app.post('/events', function (req, res) {
    if(import_active) {
        res.status(429);
        res.send('Error. Import already started');
        return;
    }
    import_active = 1;
    json_handler.readFromFile(  __dirname + json_path, 
                                async function (data, resume) {
                                    await dbh.insertEventPackage(data);
                                    setTimeout(() => resume(), 1000);
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
    dbh.deletePercent(req.params.percent).then(
        function(res) {
            console.log('Delete trx success')
        },
        function(err) {
            console.log(err)
        } 
    );
});

app.listen(8080, () => console.log('listening on port 8080'))