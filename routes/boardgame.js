const path = './public/json/boardgame.json';
const fs = require('fs/promises');
const util = require('../util');
var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
    let idArray = req.query.id.split(',').map(item => parseInt(item));

    fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
    .then(data => {
        const jsonData = JSON.parse(data).data;
        const resData = [];
        idArray.forEach(id => resData.push(jsonData.find(item => item.id === id)));
        return resData;
    })
    .then(data => {
        res.send(JSON.stringify({
            code : 200,
            data
        }));
    })
    .catch(error => {
        res.send(JSON.stringify({
            code : 404,
            error
        }));
    })
});

router.get('/find', (req, res, next) => {
    let { title, player, weight, system} = req.query;
    
    const filterFunc = data => {
        if(title && data.title.indexOf(title) === -1) {
            return false;
        }
        if(player) {
            if(player == 7 && data.player[1] < 7) {
                return false;
            }
            else if(data.player[0] > player || data.player[1] < player) {
                return false;
            }
        }
        if(weight && data.weight != weight) {
            return false;
        }
        if(system && data.system.indexOf(system) === -1) {
            return false;
        }
        return true;
    }

    util.sendFilterData(fs, res, path, filterFunc);
});

router.post('/post/register', (req, res, next) => {
    let username = req.body.username;
    util.updateFile(fs, './public/json/test.json', [{ "username" : username }]);
    res.send(JSON.stringify({
        code : 200,
        you : username
    }));
});

module.exports = router;