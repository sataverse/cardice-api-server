const fs = require('fs/promises');
const util = require('../util');
var express = require('express');
var path = require('path');
var router = express.Router();

router.get('/', (req, res, next) => {
  let idArray = req.query.id.split(',').map((item) => parseInt(item));

  fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' })
    .then((data) => {
      const jsonData = JSON.parse(data).data;
      const resData = [];
      idArray.forEach((id) => resData.push(jsonData.find((item) => item.id === id)));
      return resData;
    })
    .then((data) => {
      res.send(
        JSON.stringify({
          code: 200,
          data,
        })
      );
    })
    .catch((error) => {
      res.send(
        JSON.stringify({
          code: 404,
          error,
        })
      );
    });
});

router.get('/all', (req, res, next) => {
  util.sendAllData(fs, res, util.pathGame);
});

router.get('/all/simple', (req, res, next) => {
  (async () => {
    try {
      const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
      const gameData = JSON.parse(gameFileData).data;
      console.log('1:', gameData[0]);
      const simpleData = gameData.map((data) => ({
        id: data.id,
        title: data.title,
        rating: data.rating,
        image: data.image,
      }));
      console.log('2:', simpleData);
      res.send(
        JSON.stringify({
          code: 200,
          data: simpleData,
        })
      );
    } catch (error) {
      res.send(
        JSON.stringify({
          code: 404,
          error,
        })
      );
    }
  })();
});

router.get('/all/detail', (req, res, next) => {
  let { id } = req.query;

  (async () => {
    try {
      const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
      const gameData = JSON.parse(gameFileData).data;
      console.log(gameData[id]);

      const detailData = {
        title: gameData[id].titleEN,
        year: gameData[id].year,
        introduction: gameData[id].introduction,
        rating: gameData[id].rating,
        weight: gameData[id].weight,
        player: [gameData[id].player[0], gameData[id].player[1]],
        time: gameData[id].playTime[1],
        image: gameData[id].image,
        youtube: gameData[id].youtube,
      };
      res.send(
        JSON.stringify({
          code: 200,
          data: detailData,
        })
      );
    } catch (error) {
      res.send(
        JSON.stringify({
          code: 404,
          error,
        })
      );
    }
  })();
});

router.get('/allimg', (req, res, next) => {
  (async () => {
    try {
      const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
      const gameData = JSON.parse(gameFileData).data;
      const imageData = [];
      for (var i = 0; i < gameData.length; i++) {
        const img = await fs.readFile(`./public/images${gameData[i].image}`, { encoding: 'base64' });
        imageData.push({ ...gameData[i], image: img });
      }
      console.log(imageData[0].rating);
      res.send(
        JSON.stringify({
          code: 200,
          data: [...imageData],
        })
      );
    } catch (error) {
      res.send(
        JSON.stringify({
          code: 404,
          error,
        })
      );
    }
  })();
});

router.get('/list', (req, res, next) => {
  (async () => {
    try {
      const gameFileData = await fs.readFile(util.pathGame, { encoding: 'utf-8', flag: 'r' });
      const listFileData = await fs.readFile(util.pathSlider, { encoding: 'utf-8', flag: 'r' });
      const gameData = JSON.parse(gameFileData).data;
      const listData = JSON.parse(listFileData);
      const resData = [];
      listData.forEach((item) => {
        const gameList = [];
        item.list.forEach((id) => gameList.push(gameData.find((item) => item.id === id)));
        resData.push({ title: item.title, list: gameList });
      });
      res.send(
        JSON.stringify({
          code: 200,
          data: resData,
        })
      );
    } catch (error) {
      res.send(
        JSON.stringify({
          code: 404,
          error,
        })
      );
    }
  })();
});

router.get('/find', (req, res, next) => {
  let { title, player, weight, system } = req.query;

  const filterFunc = (data) => {
    if (title && data.title.indexOf(title) === -1 && data.titleEN.indexOf(title) === -1) {
      return false;
    }
    if (player) {
      if (player == 7 && data.player[1] < 7) {
        return false;
      } else if (data.player[0] > player || data.player[1] < player) {
        return false;
      }
    }
    if (weight && data.weight != weight) {
      return false;
    }
    if (system && data.system.indexOf(system) === -1) {
      return false;
    }
    return true;
  };

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
      const gameIndex = gameJsonData.data.findIndex((item) => item.id === gameid);
      const userIndex = userJsonData.data.findIndex((item) => item.id === userid);
      gameJsonData.data[gameIndex].like += status ? 1 : -1;
      if (status) {
        userJsonData.data[userIndex].like.boardgame.unshift(gameid);
      } else {
        userJsonData.data[userIndex].like.boardgame = userJsonData.data[userIndex].like.boardgame.filter(
          (item) => item !== gameid
        );
      }
      await fs.writeFile(util.pathGame, JSON.stringify(gameJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
      await fs.writeFile(util.pathUser, JSON.stringify(userJsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
      res.send(
        JSON.stringify({
          code: 200,
        })
      );
    } catch (error) {
      res.send(
        JSON.stringify({
          code: 404,
          error,
        })
      );
    }
  })();
});

module.exports = router;
