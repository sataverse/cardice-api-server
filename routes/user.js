const fs = require('fs/promises');
const bcrypt = require('bcrypt');
const util = require('../util');
var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  let id = parseInt(req.query.id);

  fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' })
  .then(data => JSON.parse(data).data.find(item => item.id === id))
  .then(data => {
    const { password, ...otherData } = data;
    res.send(JSON.stringify({
      code : 200,
      data : otherData
    }));
  })
  .catch(error => {
    res.send(JSON.stringify({
      code : 404,
      error
    }));
  })
});

router.post('/signin', (req, res, next) => {
  let {token, email : emailReq, password : passwordReq} = req.body;

  if(token !== util.token) {
    res.send(JSON.stringify({
      code : 403
    }));
    return;
  }

  ( async () => {
    try {
      const fileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
      const jsonData = JSON.parse(fileData).data.find(item => item.email === emailReq);
      if(!jsonData) {
        res.send(JSON.stringify({
          code : 401
        }));
      }
      else {
        const { password, ...data } = jsonData;
        const matchPassword = await bcrypt.compare(passwordReq, password);
        if(!matchPassword) {
          res.send(JSON.stringify({
            code : 401
          }));
        }
        else {
          res.send(JSON.stringify({
            code : 200,
            data
          }));
        }
      }
    } catch (error) {
      res.send(JSON.stringify({
        code : 404,
        error
      }));
    }
  })();
});

router.post('/signup', (req, res, next) => {
  let { token, email : emailReq, nickname : nicknameReq, password : passwordReq } = req.body;

  if(token !== util.token) {
    res.send(JSON.stringify({
      code : 403
    }));
    return;
  }

  ( async () => {
    try {
      const fileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
      const { lastid, data } = JSON.parse(fileData);
      const isValidEmail = data.findIndex(item => item.email === emailReq) == -1;
      const isValidNickname = data.findIndex(item => item.nickname === nicknameReq) == -1;
      if(isValidEmail && isValidNickname) {
        const hashedPassword = await bcrypt.hash(passwordReq, 10);
        const newData = {
          id: lastid + 1, 
          email : emailReq,
          password : '0',
          nickname: nicknameReq,
          grade : 2,
          like : {
            boardgame : [],
            review : [],
            post : []
          },
          review : [],
          post :[],
          comment : []
        }
        const updatedFileData = { 
          lastid : lastid + 1, 
          data : [ 
            ...data, 
            { 
              ...newData,
              password : hashedPassword,
            }
          ]
        };
        await fs.writeFile(util.pathUser, JSON.stringify(updatedFileData, null, 2), { encoding: 'utf-8', flag: 'w' });
        res.send(JSON.stringify({
          code : 200,
          data : newData
        }));
      }
      else {
        res.send(JSON.stringify({
          code : 409,
          data : isValidEmail ? 1 : isValidNickname ? 0 : 2
        }));
      }
    } catch (error) {
      console.log(error);
      res.send(JSON.stringify({
        code : 404,
        error
      }));
    }
  })();
});

router.get('/check/email/:email', (req, res, next) => {
  let email = req.params.email;

  fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' })
  .then(data => {
    if(JSON.parse(data).data.findIndex(item => item.email === email) == -1) {
      res.send(JSON.stringify({
        code : 200
      }));
    }
    else {
      res.send(JSON.stringify({
        code : 409
      }));
    }
  })
  .catch(error => {
    res.send(JSON.stringify({
      code : 404,
      error
    }));
  })
});

router.get('/check/nickname/:nickname', (req, res, next) => {
  let nickname = req.params.nickname;

  fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' })
  .then(data => {
    if(JSON.parse(data).data.findIndex(item => item.nickname === nickname) == -1) {
      res.send(JSON.stringify({
        code : 200
      }));
    }
    else {
      res.send(JSON.stringify({
        code : 409
      }));
    }
  })
  .catch(error => {
    res.send(JSON.stringify({
      code : 404,
      error
    }));
  })
});

router.delete('/delete', (req, res, next) => {
  let { token, id : idReq, password : passwordReq} = req.body;

  if(token !== util.token) {
    res.send(JSON.stringify({
        code : 403
    }));
    return;
  }

  ( async () => {
    try {
      const userFileData = await fs.readFile(util.pathUser, { encoding: 'utf-8', flag: 'r' });
      const {lastid : userLastId, data : userData} = JSON.parse(userFileData);
      const deleteUserIndex = userData.findIndex(item => item.id === idReq);
      const matchPassword = await bcrypt.compare(passwordReq, userData[deleteUserIndex].password);
      if(!matchPassword) {
        res.send(JSON.stringify({
          code : 401
        }));
      }
      else {
        const reviewFileData = await fs.readFile(util.pathReview, { encoding: 'utf-8', flag: 'r' });
        const {lastid : reviewLastId, data : reviewData} = JSON.parse(reviewFileData);
        for(var i = 0; i < reviewData.length; i++) {
          if(userData[deleteUserIndex].review.indexOf(reviewData[i].id) != -1) {
            reviewData[i].nickname = '(탈퇴한 회원)';
          }
        }
        await fs.writeFile(util.pathReview, JSON.stringify({lastid : reviewLastId, data : reviewData}, null, 2), { encoding: 'utf-8', flag: 'w' });
        userData.splice(deleteUserIndex, 1);
        await fs.writeFile(util.pathUser, JSON.stringify({lastid : userLastId, data : userData}, null, 2), { encoding: 'utf-8', flag: 'w' });
        res.send(JSON.stringify({
          code : 200
        }));
      }
    } catch (error) {
      res.send(JSON.stringify({
        code : 404,
        error
      }));
    }
  })();
});


module.exports = router;
