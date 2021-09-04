const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

const MongoClient = require('mongodb').MongoClient;

var db;
MongoClient.connect('mongodb+srv://mongodb:mongodb@cluster0.n1atu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(error, client){

    if (error) return console.log(error)

    db = client.db('express');

    db.collection('post').insertOne({이름 : 'John', _id : 1}, function(error, result){
        console.log('저장완료');
    });

    app.listen(8080, function(){
        console.log('listening on 8080')
    });

    app.post('/add', function(req, res){
        res.send('전송완료');
        console.log(req.body);
        db.collection('post').insertOne({ 제목 : req.body.title, 날짜 : req.body.date})
    });

    app.get('/list', function(req, res){
        res
    })
});


app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html')
});

app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html')
});
