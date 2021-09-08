var router = require('express').Router();
//로그인한 유저 적용법
router.use(로그인확인);

function 로그인확인(req, res, next) {
    if (req.user) { next() }
    else { res.send('로그인확인해주세요')}
}

router.get('/shirts', function(요청, 응답){
    응답.send('셔츠 파는 페이지입니다.');
 });
 
router.get('/pants', function(요청, 응답){
    응답.send('바지 파는 페이지입니다.');
});
//module.exports = 변수명, require('./파일경로)
module.exports = router;