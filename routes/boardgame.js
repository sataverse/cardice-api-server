const fs = require('fs/promises');
const util = require('../util');
var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
    let idArray = req.query.id.split(',').map(item => parseInt(item));

    fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' })
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

router.get('/all', (req, res, next) => {
    util.sendAllData(fs, res, util.pathGame);
});

router.get('/list', (req, res, next) => {
    (async () => {
        try {
            const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
            const listFileData = await fs.readFile(util.pathSlider, { encoding: 'utf-8', flag: 'r' });
            const gameData = JSON.parse(gameFileData).data;
            const listData = JSON.parse(listFileData);
            const resData = [];
            listData.forEach(item => {
                const gameList = [];
                item.list.forEach(id => gameList.push(gameData.find(item => item.id === id)));
                resData.push({ title: item.title, list: gameList});
            });
            res.send(JSON.stringify({
                code : 200,
                data : resData
            }));
        } catch (error) {
            res.send(JSON.stringify({
                code : 404,
                error
            }));
        }
    })();
});

router.get('/find', (req, res, next) => {
    let { title, player, weight, system } = req.query;

    const filterFunc = data => {
        if(title && (data.title.indexOf(title) === -1 && data.titleEN.indexOf(title) === -1)) {
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

    util.sendFilterData(fs, res, util.pathGame, filterFunc);
});

router.post('/like', (req, res, next) => {
    let { gameid, userid, status } = req.body;
    (async () => {
        try {
            const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
            const userFileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
            const gameJsonData = JSON.parse(gameFileData);
            const userJsonData = JSON.parse(userFileData);
            const gameIndex = gameJsonData.data.findIndex(item => item.id === gameid);
            const userIndex = userJsonData.data.findIndex(item => item.id === userid);
            gameJsonData.data[gameIndex].like += status ? 1 : -1;
            if(status){
                userJsonData.data[userIndex].like.boardgame.unshift(gameid);
            }
            else {
                userJsonData.data[userIndex].like.boardgame = userJsonData.data[userIndex].like.boardgame.filter(item => item !== gameid);
            }
            await fs.writeFile(util.pathGame, JSON.stringify(gameJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
            await fs.writeFile(util.pathUser, JSON.stringify(userJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
            res.send(JSON.stringify({
                code : 200
            }));
        } catch (error) {
            res.send(JSON.stringify({
                code : 404,
                error
            }));
        }
    })();
});

module.exports = router;