const redis = require('redis')
const dbh = require('./db.js');
const cache = redis.createClient();
const lifetime = 5;

cache.on("error", function(err) {
  console.log("Error " + err);
})

  
exports.fetchPageCached = (limit, offset, cback) => {
    cache.get('page:' + offset + limit, (err, page) => {
        if (page !== null) {
            return cback(page);
        }

        dbh.fetchPage(limit, offset).then((page) => {
            cache.setex('page:' + offset + limit, lifetime, JSON.stringify(page), () => {
                cback(page);
            });
        });
    });
}

exports.getEventQuantity = (cback) => {
    cache.get('eventsQuant', (err, quant) => {
        if (quant !== null) {
            return cback(quant);
        }

        dbh.getEventQuantity(null).then((quant) => {
            cache.setex('eventsQuant', lifetime, quant.length, () => {
                cback(quant.length);
            });
        });
    });
}