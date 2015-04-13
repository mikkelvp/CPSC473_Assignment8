#!/usr/bin/env node

var express = require('express'),
    http = require('http'),
	app = express(),
	bodyParser = require('body-parser'),
	router = express.Router(),
	mongoClient = require('mongodb').MongoClient,
    db,
    seed = 49999;

// connect to db
mongoClient.connect("mongodb://localhost:27017/urlshortener", function (err, mdb) {
    if (!err) {
        console.log("Connected to db");
        db = mdb;

        // create next key in db if it does not exist
        db.collection('next').findAndModify(
        { next: 'next' },
        [[ 'next', 1 ]],
        { $setOnInsert: { value: seed } },
        { upsert: true },
        function (err, result) {
            if (err !== null) {
                console.log(err);
            }
        });

        // create capped collection if it does not exist
        db.collection('top10').isCapped( function (err, capped) {
            if (!capped) {
                db.createCollection( 'top10', { capped: true, size: 4096 }, function (err, result) {
                    if (result !== null) {
                        Console.log("top10 collection created");
                    }
                    else {
                        console.log("top10 collected NOT created." +err);
                    }
                });
            }
        });
    }
    else {
        console.log(err);
    }
});

app.use(express.static(__dirname + "/client"));

// set up body-parser to get POST data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

http.createServer(app).listen(3000);
console.log("Service started on port 3000");

function encode(num) {
    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    base = alphabet.length;

    var str = '';
        while (num > 0) {
            str = alphabet.charAt(num % base) + str;
            num = Math.floor(num / base);
        }
        return str;
}

function nextKey(callback) {
    var incrValue = Math.round(Math.random() * 10);
    var collection = db.collection('next');
    // increment next value
    collection.update(
        { next: 'next' }, 
        { $inc: {value: incrValue} }, 
        function (err, result) {
            if (result !== null) {
            collection.findOne( { next: 'next'}, function (err, result) {
                    console.log(result);
                    callback(result.value);
                });
        }
    } );
}

router.route('/:key')
.get( function (req, res) {
    db.collection('url').findOne( { key: req.params.key }, function (err, result) {
        if (result !== null) {
            res.redirect(result.url);
            // increment hits
            db.collection('top10').update( { key: req.params.key }, { $inc: { hits: 1 } }, { upsert: true }, function (err, result) {
                if (err !== null) {
                    console.log("increment hits error: " +err);
                }
            });
        }
        else {
            res.status(404).send('404 not found');
        }

    });
});

router.route('/shorten')
.post( function (req, res) {
    nextKey( function (num) {
        var key = encode(num);
        db.collection('url').save( { key: key, url: req.body.url }, function (err, result) {
            if (err !== null) {
                console.log(err);
            }
        });
        res.json( { key: key } );
    });
});

router.route('/url/:key')
.get( function (req, res) {
    db.collection('url').findOne( { key: req.params.key }, function (err, result) {
    if (result !== null) {
        res.json( { url: result.url } );
    }
    else {
        res.status(404).send('404 not found');
    }
    });
});

router.route('/top/get')
.get( function (req, res) { 
    db.collection('top10').find( {}, { sort: [['hits', 'desc']], limit: 10 } ).toArray( function (err, result) {
        if (result !== null) {
            res.json( {top10: result} );
        }
        else {
            console.log(err);
            res.status(404).send('404 not found');
        }
    });
});

app.use(router);