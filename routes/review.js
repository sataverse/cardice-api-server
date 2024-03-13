const path = './public/json/review.json';
const fs = require('fs/promises');
const util = require('../util');
var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
    let idArray = req.query.id.split(',').map(item => parseInt(item));

    (async () => {
        try {
            const reviewData = await fs.readFile(path, { encoding: 'utf-8', flag: 'r' });
            const userData = await fs.readFile('./public/json/user.json', { encoding: 'utf-8', flag: 'r' });
            const reviewJsonData = JSON.parse(reviewData).data;
            const userJsonData = JSON.parse(userData).data;
            const resData = [];
            idArray.forEach(id => {
                const review = reviewJsonData.find(item => item.id === id);
                const user = userJsonData.find(item => item.id === review.userid);
                resData.push({ ...review, nickname : user.nickname });
            });
            res.send(JSON.stringify({
                code : 200,
                data : resData
            }));
        } catch (error) {
            console.error('file update failed : ', error);
        }
    })();
});

router.post('/register', (req, res, next) => {
    let review = req.body;
    
    util.updateFile(fs, path, review);
    res.send(JSON.stringify({
        code : 200,
        you : review.userid
    }));
});

module.exports = router;