var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs');
var counter = 0;

//todo: delay после лимита
exports.readFromFile = function (filePath, processOneCb, completeCb, onProgress) {
    
    var stat = fs.statSync(filePath);
    var jsonSize = stat.size;
    var uploadedSize = 0;
    var stream = JSONStream.parse('*');
    stream.on('data', function(buffer) {
        var segmentLength = JSON.stringify(buffer).length;
        uploadedSize += segmentLength;
        onProgress(Math.ceil(uploadedSize/jsonSize*100));
    });

    var fileStream = fs.createReadStream(filePath, {encoding: 'utf8', flags: 'r'});
    fileStream
            .pipe(stream)
            .pipe(es.through(function (data) {
                counter ++;
                console.log('get event');
                this.pause();
                processOneCb(data, this.resume, counter);
                return data;
            }, function end() {
                console.log('stream reading ended');
                onProgress('100');
                completeCb();
                this.emit('end');
            }));
}
