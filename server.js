const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));

const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');


app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html')
});

app.get('/write', function(req, res){
    res.sendFile(__dirname + '/write.html')
});

app.get('/list', function(req, res){

    db.collection('post').find().toArray(function(err, result){
        res.render('list.ejs', { posts : result });
    });
});

var db;
MongoClient.connect('mongodb+srv://mongodb:mongodb@cluster0.n1atu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', function(error, client){

    if (error) return console.log(error)

    db = client.db('express');

    // db.collection('post').insertOne({이름 : 'John', _id : 1}, function(error, result){
    //     console.log('저장완료');
    // });

    app.listen(8080, function(){
        console.log('listening on 8080')
    });

    app.post('/add', function(req, res){
        res.send('전송완료');
        // db.counter내의 총게시물갯수를 찾음
        db.collection('counter').findOne({name : '게시물갯수'}, function(err, result){
            // 총게시물갯수 변수에 저장
            var 총게시물갯수 = result.totalPost;

            db.collection('post').insertOne({ _id : 총게시물갯수 + 1, 제목 : req.body.title, 날짜 : req.body.date})
            });
            //counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜줘야함 (수정);
            db.collection('counter').updateOne({ name : '게시물갯수'},{ $inc: { totalPost : 1 }},function(err, result){
                if(err){return console.log(err)}
            });
        });    
});

app.delete('/delete', function(req, res){
    //id값 int로 바꿔주는 js문법(parseInt)
    req.body._id = parseInt(req.body._id)
    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제
    db.collection('post').deleteOne(req.body, function(err, result){
        //성공했을시 어떻게 할지 해주는 콜백함수
        console.log('삭제완료');
    });
    res.send('삭제완료')
})