const path = './public/json/user.json';
const fs = require('fs/promises');
const bcrypt = require('bcrypt');
const util = require('../util');
var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  let id = parseInt(req.query.id);

  fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
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

  /*
  fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
  .then(data => JSON.parse(data).data.find(item => item.id === id))
  .then(data => bcrypt.hash(data.password, 10))
  .then(password => bcrypt.compare(passwd, password))
  .then(correct => console.log(correct))
  */
});

router.post('/signin', (req, res, next) => {
  let emailReq = req.body.email;
  let passwordReq = req.body.password;

  ( async () => {
    try {
      const fileData = await fs.readFile(path, { encoding: 'utf-8', flag: 'r' });
      const jsonData = JSON.parse(fileData).data.find(item => item.email === emailReq);
      if(!jsonData) {
        res.send(JSON.stringify({
          code : 401
        }));
      }
      else {
        const { password, ...data } = jsonData;
        const mathchPassword = await bcrypt.compare(passwordReq, password);
        if(!mathchPassword) {
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
  let dataReq = req.body;

  ( async () => {
    try {
      const hashedPassword = await bcrypt.hash(dataReq.password, 10);
      const fileData = await fs.readFile(path, { encoding: 'utf-8', flag: 'r' });
      const { lastid, data } = JSON.parse(fileData);
      const updatedFileData = { 
        lastid : lastid + 1, 
        data : [ 
          ...data, 
          { 
            id: lastid + 1, 
            ...dataReq, 
            password : hashedPassword,
            grade : 0,
            like : [],
            review : [],
            post :[]
          }
        ]
      };
      await fs.writeFile(path, JSON.stringify(updatedFileData, null, 2), {
          encoding: 'utf-8',
          flag: 'w'
      });
      res.send(JSON.stringify({
        code : 200
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
  let idReq = parseInt(req.body.id);
  let passwordReq = req.body.password;

  ( async () => {
    try {
      const fileData = await fs.readFile(path, { encoding: 'utf-8', flag: 'r' });
      const jsonData = JSON.parse(fileData);
      const deleteUserIndex = jsonData.data.findIndex(item => item.id === idReq);
      const mathchPassword = await bcrypt.compare(passwordReq, jsonData.data[deleteUserIndex].password);
      if(!mathchPassword) {
        res.send(JSON.stringify({
          code : 401
        }));
      }
      else {
        jsonData.data[deleteUserIndex] = {
          ...jsonData.data[deleteUserIndex],
          email : "-",
          password : "-",
          nickname : "탈퇴한 회원",
          grade : -1
        }
        await fs.writeFile(path, JSON.stringify(jsonData, null, 2), { encoding: 'utf-8', flag: 'w' });
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

router.get('/check/email/:email', (req, res, next) => {
  let email = req.params.email;

  fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
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

  fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
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


module.exports = router;
