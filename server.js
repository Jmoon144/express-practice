const express = require('express');
const app = express();
//웹소켓
const http = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : true}));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.set('/public', express.static('public'));
const methodOverrider = require('method-override')
app.use(methodOverrider('_method'))

require('dotenv').config()

var db;
MongoClient.connect(process.env.DB_URL, function(error, client){

    if (error) return console.log(error)

    db = client.db('express');

    // db.collection('post').insertOne({이름 : 'John', _id : 1}, function(error, result){
    //     console.log('저장완료');
    // });

    http.listen(process.env.PORT, function(){
        console.log('listening on 8080')
    });

    app.post('/add', function(req, res){
        
        res.send('전송완료');
        console.log(req.body)
        // db.counter내의 총게시물갯수를 찾음
        db.collection('counter').findOne({name : '게시물갯수'}, function(err, result){
            console.log(result.totalPost)
            // 총게시물갯수 변수에 저장
            var 총게시물갯수 = result.totalPost;

            db.collection('post').insertOne({ _id : 총게시물갯수 + 1, 제목 : req.body.title, 날짜 : req.body.date})
            
            //counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜줘야함 (수정);
                db.collection('counter').updateOne({ name : '게시물갯수'},{ $inc: { totalPost : 1 }},function(err, result){
                    if(err){return console.log(err)}
                });
            });
        });    
}); 

app.get('/', function(req, res){
    // res.sendFile(__dirname + 'views/index.ejs')
    res.render('index.ejs');
});

app.get('/write', function(req, res){
    // res.sendFile(__dirname + '/write.ejs')
    res.render('write.ejs');
});

app.get('/signup', function(req, res){
    // res.sendFile(__dirname + '/write.ejs')
    res.render('signup.ejs');
});

app.get('/list', function(req, res){
    
    db.collection('post').find().toArray(function(err, result){
        res.render('list.ejs', { posts : result });
    });
});

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        console.log(result);
        res.render('detail.ejs', { data : result });
        
    })
})

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({_id : parseInt(req.params.id)}, function(err, result){
        console.log(result)
        res.render('edit.ejs', { post : result });
    })
    
})

app.put('/edit', function(req, res){
    //폼에담긴 제목, 날짜 데이터를 가지고 db.collection  에다가 업데이트(set)
    db.collection('post').updateOne({ _id : parseInt(req.body.id) }, {$set : { 제목 : req.body.title, 날짜 : req.body.date }}, function(err, result){
        console.log('수정완료')
        res.redirect('/list')
    });
});

app.get('/search', function(req, res){
    var 검색조건 = [
        {
            $search: {
                index: 'titleSearch', // 인덱스 이름
                text: {
                    query: req.query.value,
                    path: '제목' // 여러개 찾고 싶으면 ['제목', '날짜']
                }
            }
        },
        // 정렬
        // { $sort : { _id : 1 }},
        // 검색 수
        // { $limit : 10}
        //검색 score가져오기(idx)
        // { $project : { 제목 : 1, _id: 0, score: { $meta: "searchScore"} } }
    ]
    console.log(req.query.value);
    db.collection('post').aggregate(검색조건).toArray((err, result)=>{
        console.log(result)
        res.render('search.ejs', {posts : result})
    });
});

//세션방식 다운받은거
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

//미들웨어(app.use) = 요청, 응답 중간에 코드 실행하고 싶을 때 사용
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', function(req, res){
    res.render('login.ejs')
});

//passport로그인 쉽게 해줌, authenticate()를 통해 인증
//redirect => 여기로 보내주세요
app.post('/login', passport.authenticate('local', {
    failureRedirect : '/fail'
}), function(req, res){
    res.redirect('/')
});

//미들웨어는 중앙에 넣어줍니다.
app.get('/mypage', 로그인확인, function(req, res){
    // console.log(req.user)
    res.render('mypage.ejs', {사용자 : req.user})
});

function 로그인확인(req, res, next){
    if (req.user){
        next()
    } else {
        res.send('로그인 확인해주세요')
    }
};

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true, //로그인 후 세션 저장
    passReqToCallback: false,
    //사용자 입력한 내용 인증하는 콜백함수
  }, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    //현재는 암호화 하지 않기 때문에 보안이 좋지 않기 때문에 추후 jwt로 수정 예정
    db.collection('login').findOne({ id: 입력한아이디 }, function (err, result) {
      if (err) return done(err)
      // 결과에 일치하는게 없을 때 에러처리
      if (!result) return done(null, false, { message: '존재하지않는 아이디입니다.' })
      // 일치하는게 있을 때 입력한 비번과 결과 pw 비교
      if (입력한비번 == result.password) {
        return done(null, result)
      } else {
        return done(null, false, { message: '비밀번호를 확인해주세요.' })
      }
    })
  }));

//세션을 저장시키는 코드(로그인 성공시 발동)
//세션의 id정보를 쿠키로 보냄
passport.serializeUser(function(user, done){
    done(null, user.id)
});

//로그인한 유저의 개인정보를 db에서 찾는 역할
passport.deserializeUser(function(아이디, done){
    db.collection('login').findOne({id : 아이디}, function(err, result){
        done(null, result)
    })
});

app.post('/sign', function(req, res){
    res.send('회원가입 완료')
    console.log(req.body)
    db.collection('counter').findOne({name : '아이디갯수'}, function(err, result){
        console.log(result.totalId)
        var 총아이디갯수 = result.totalId;

        db.collection('login').insertOne({ _id : 총아이디갯수 + 1, id : req.body.id, password : req.body.pw})

            db.collection('counter').updateOne({name : '아이디갯수'}, { $inc: {totalId : 1}}, function(err, result){
                if(err){return console.log(err)}
            });
    })
});

app.delete('/delete', function(req, res){
    console.log(req.body)
    req.body._id = parseInt(req.body._id);
    var 삭제할데이터 = { _id : req.body._id, 작성자 : req.user._id }
    db.collection('post').deleteOne(삭제할데이터, function(err, result){
        console.log('삭제완료');
        if(result) {console.log(result)}
        res.status(200).send({ Message : 'SUCCESS'});
    });
});


app.use('/shop', require('./routes/shop.js'));

app.use('/board/sub', require('./routes/board.js'));



//웹소켓으로 채팅서비스 만들기
//서버랑 socket으로 문자 주고 받기
app.get('/chat', function(req, res){
    res.render('chat.ejs');
});

io.on('connection', function(socket){
    console.log('연결되었습니다.');

    socket.on('인사말', function(data){
        console.log(data)
        //모든참여자한테 전파하는법
        io.emit('퍼트리기', data)
    });

});

//채팅방 만들기
var chat1 = io.of('/채팅방1');
chat1.on('connection', function(socket){
    console.log('채팅방1에 연결되었습니다.');

    socket.on('인사말', function(data){
        console.log(data)
        //모든참여자한테 전파하는법
        chat1.emit('퍼트리기', data)
    });

});