#!/usr/bin/env node

var express = require('express'),
    http = require('http'),
	app = express(),
	bodyParser = require('body-parser'),
	router = express.Router(),
	redis = require('redis'),
	client = redis.createClient(),
    seed = 49999;

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
    client.setnx('next', seed, function (err, reply) {
        if (err !== null) {
            console.log(err);
        }
        client.incrby('next', Math.round(Math.random() * 10), function (err, reply) { // Random so the next key will be harder to guess.
            if (err !== null) {
            console.log(err);
            }
            if (reply !== null) {
                callback(reply);
            }
        }); 
    });
}

router.route('/:key')
.get( function (req, res) {
    client.get(req.params.key, function (err, reply) {
        if (err !== null) {
            console.log(err);
        }

        if (reply !== null) {
        res.redirect(reply);

        client.zincrby('hits', 1, req.params.key, function (err, reply) {
            if (err !== null) {
            console.log(err);
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
        client.set(key, req.body.key);
        res.json({key: key});
    });
});

router.route('/url/:key')
.get( function (req, res) {
    client.get(req.params.key, function (err, reply) {
        if (err !== null) {
            console.log(err);
        }
        
        if (reply !== null) {
            res.json({url: reply});
        }
        else {
            res.status(404).send('404 not found');
        }
    }
    );
});

router.route('/top/get')
.get( function (req, res) {
    client.zrevrange('hits', 0, 9, 'withscores', function (err, reply) {
        if (err !== null) {
            console.log(err);
        }
        
        if (reply !== null) {
            res.json({top10: reply});
        }
        else {
            res.status(404).send('404 not found');
        }
    });
});

app.use(router);