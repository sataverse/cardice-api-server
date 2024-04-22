const fs = require('fs/promises');
const util = require('../util');
var express = require('express');
var router = express.Router();

const getRating = value => Math.round(value * 1000) / 1000;

router.get('/', (req, res, next) => {
    let idArray = req.query.id.split(',').map(item => parseInt(item));

    (async () => {
        try {
            const reviewFileData = await fs.readFile(util.pathReview, { encoding: 'utf-8', flag: 'r' });
            const reviewData = JSON.parse(reviewFileData).data;
            const resData = [];
            idArray.forEach(id => {
                const review = reviewData.find(item => item.id === id);
                resData.push(review);
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

router.post('/like', (req, res, next) => {
    let { token, reviewid, userid, status } = req.body;

    if(token !== util.token) {
        res.send(JSON.stringify({
            code : 403
        }));
        return;
    }

    (async () => {
        try {
            const reviewFileData = await fs.readFile(util.pathReview, { encoding: 'utf-8', flag: 'r' });
            const userFileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
            const reviewJsonData = JSON.parse(reviewFileData);
            const userJsonData = JSON.parse(userFileData);
            const reviewIndex = reviewJsonData.data.findIndex(item => item.id === reviewid);
            const userIndex = userJsonData.data.findIndex(item => item.id === userid);
            reviewJsonData.data[reviewIndex].like += status ? 1 : -1;
            if(status){
                userJsonData.data[userIndex].like.review.push(reviewid);
            }
            else {
                userJsonData.data[userIndex].like.review = userJsonData.data[userIndex].like.review.filter(item => item !== reviewid);
            }
            await fs.writeFile(util.pathReview, JSON.stringify(reviewJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
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

router.post('/register', (req, res, next) => {
    let { token, gameid, userid, rating, comment, date, nickname } = req.body;

    if(token !== util.token) {
        res.send(JSON.stringify({
            code : 403
        }));
        return;
    }

    (async () => {
        try {
            const reviewFileData = await fs.readFile(util.pathReview, { encoding: 'utf-8', flag: 'r' });
            const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
            const userFileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
            const { lastid : reviewLastId, data : reviewData } = JSON.parse(reviewFileData);
            const { lastid : gameLastId, data : gameData } = JSON.parse(gameFileData);
            const { lastid : userLastId, data : userData } = JSON.parse(userFileData);
            const reviewReq = {
                id : reviewLastId + 1,
                gameid,
                userid,
                rating,
                comment,
                date,
                like : 0,
                nickname
            }
            const updatedReviewData = { 
                lastid : reviewLastId + 1, 
                data : [
                    ...reviewData,
                    reviewReq
                ] 
            }
            const gameIndex = gameData.findIndex(item => item.id === gameid);
            gameData[gameIndex].review.push(reviewLastId + 1);
            gameData[gameIndex].rating = getRating((gameData[gameIndex].reviewers * gameData[gameIndex].rating + rating) / (gameData[gameIndex].reviewers + 1));
            gameData[gameIndex].reviewers++;
            const updatedGameData = {
                lastid : gameLastId,
                data : gameData
            }
            const userIndex = userData.findIndex(item => item.id === userid);
            userData[userIndex].review.push(reviewLastId + 1);
            const updatedUserData = {
                lastid : userLastId,
                data : userData
            }
            await fs.writeFile(util.pathReview, JSON.stringify(updatedReviewData, null, 2), { encoding: 'utf-8', flag: 'w' });
            await fs.writeFile(util.pathGame, JSON.stringify(updatedGameData, null, 2), { encoding: 'utf-8', flag: 'w' });
            await fs.writeFile(util.pathUser, JSON.stringify(updatedUserData, null, 2), { encoding: 'utf-8', flag: 'w' });
            res.send(JSON.stringify({
                code : 200,
                data: reviewReq
            }));
        } catch (error) {
            res.send(JSON.stringify({
                code : 404,
                error
            }));
        }
    })();
});

router.post('/modify', (req, res, next) => {
    let { token, reviewid, gameid, rating, previous, comment, date } = req.body;

    if(token !== util.token) {
        res.send(JSON.stringify({
            code : 403
        }));
        return;
    }

    (async () => {
        try {
            const reviewFileData = await fs.readFile(util.pathReview, { encoding: 'utf-8', flag: 'r' });
            const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
            const reviewJsonData = JSON.parse(reviewFileData);
            const gameJsonData = JSON.parse(gameFileData);
            const reviewIndex = reviewJsonData.data.findIndex(item => item.id === reviewid);
            const gameIndex = gameJsonData.data.findIndex(item => item.id === gameid);
            reviewJsonData.data[reviewIndex] = {
                ...reviewJsonData.data[reviewIndex],
                rating,
                comment,
                date
            }
            gameJsonData.data[gameIndex].rating = getRating((gameJsonData.data[gameIndex].reviewers * gameJsonData.data[gameIndex].rating - previous + rating) / gameJsonData.data[gameIndex].reviewers);
            await fs.writeFile(util.pathReview, JSON.stringify(reviewJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
            await fs.writeFile(util.pathGame, JSON.stringify(gameJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
            res.send(JSON.stringify({
                code : 200,
                data: reviewJsonData.data[reviewIndex]
            }));
        } catch (error) {
            console.log(error);
            res.send(JSON.stringify({
                code : 404,
                error
            }));
        }
    })();
});

router.delete('/delete', (req, res, next) => {
    let { token, rating, reviewid, gameid, userid } = req.body;

    if(token !== util.token) {
        res.send(JSON.stringify({
            code : 403
        }));
        return;
    }

    (async () => {
        try {
            const reviewFileData = await fs.readFile(util.pathReview, { encoding: 'utf-8', flag: 'r' });
            const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
            const userFileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
            const reviewJsonData = JSON.parse(reviewFileData);
            const gameJsonData = JSON.parse(gameFileData);
            const userJsonData = JSON.parse(userFileData);
            const reviewIndex = reviewJsonData.data.findIndex(item => item.id === reviewid);
            reviewJsonData.data.splice(reviewIndex, 1);
            const gameIndex = gameJsonData.data.findIndex(item => item.id === gameid);
            gameJsonData.data[gameIndex].review = gameJsonData.data[gameIndex].review.filter(item => item !== reviewid);
            gameJsonData.data[gameIndex].rating = getRating((gameJsonData.data[gameIndex].reviewers * gameJsonData.data[gameIndex].rating - rating) / (gameJsonData.data[gameIndex].reviewers - 1));
            gameJsonData.data[gameIndex].reviewers--;
            const userIndex = userJsonData.data.findIndex(item => item.id === userid);
            userJsonData.data[userIndex].review = userJsonData.data[userIndex].review.filter(item => item !== reviewid);
            await fs.writeFile(util.pathReview, JSON.stringify(reviewJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
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