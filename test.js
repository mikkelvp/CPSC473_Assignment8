#!/usr/bin/env node

var mongo = require('mongodb').MongoClient,
    db,
    seed = 49999;

mongo.connect("mongodb://localhost:27017/urlshortener", function (err, mdb) {
    if (!err) {
        console.log("Connected to db");
        db = mdb;
        db.collection('next').findAndModify(
        { next: 'next' },
        [['next', 1]],
        { $setOnInsert: { value: seed } },
        { upsert: true },
        function (err, result) {
        	if (err !== null) {
            	console.log(err);
        	}
        }
        );

	var incrValue = Math.round(Math.random() * 10);
    db.collection('next').update(
    	{ next: 'next' }, 
    	{ $inc: { value: incrValue } }, 
    	function (err, result) {
        	if (result !== null) {
            	db.collection('next').findOne( { next: 'next'}, function (err, result) {
            		console.log(result);
            	});
        	}
        	else {
        		console.log(err);
        	}
    	});      	
   	}
    else {
        console.log(err);
    }
});