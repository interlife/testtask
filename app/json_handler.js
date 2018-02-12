var JSONStream = require('JSONStream');
var es = require('event-stream');
var fs = require('fs');
var zlib = require('zlib');
var gzipUncompressedSize = require('gzip-uncompressed-size');
var counter = 0;

exports.readFromFile = function (filePath, processPackCb, completeCb, onProgress, limit=10) {
    var jsonSize = 0;
    var package = [];
    gzipUncompressedSize.fromFile(filePath, (error, uncompressedSize) => {
        if (error) {
          throw error;
        }
        jsonSize = uncompressedSize;
      });
    
    var uploadedSize = 0;
    var stream = JSONStream.parse('*');
    stream.on('data', function(buffer) {
        var segmentLength = JSON.stringify(buffer).length;
        uploadedSize += segmentLength;
        onProgress(Math.ceil(uploadedSize/jsonSize*100));
    });

    var fileStream = fs.createReadStream(filePath);
    fileStream
            .pipe(zlib.createGunzip())
            .pipe(stream)
            .pipe(es.through(function (data) {
                counter ++;
                console.log('get event');
                package.push(data);
                if(counter % limit == 0) {
                    this.pause();
                    processPackCb(package, this.resume);
                    package = [];
                }
                return data;
            }, function end() {
                console.log('stream reading ended');
                onProgress('100');
                completeCb();
                this.emit('end');
            }));
}
