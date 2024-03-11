const fs = require('fs/promises');
var express = require('express');
var router = express.Router();

const updateFile = async (path, data) => {
    try {
        const fileContents = await fs.readFile(path, {
            encoding: 'utf-8',
            flag: 'r'
        });

        const fileData = JSON.parse(fileContents);
        const updatedFileData = [...fileData, ...data];
        await fs.writeFile(path, JSON.stringify(updatedFileData), {
            encoding: 'utf-8',
            flag: 'w'
        });

        return 'file updated';
    } catch (error) {
        console.error('file update failed : ', error);
    }
}

const readFile = async path => {
    try {
        const fileContents = await fs.readFile(path, {
            encoding: 'utf-8',
            flag: 'r'
        });

        const fileData = JSON.parse(fileContents);
        return fileData;
    } catch (error) {
        console.error('file read failed : ', error);
    }
}

/* GET users listing. */
router.get('/', function(req, res, next) {

    let username = req.query.username;

    res.send(JSON.stringify({
        code : 200,
        yourname : username
    }));
});

router.get('/game/find', function(req, res, next) {
    let title = req.query.title;
    fs.readFile('./public/json/boardgame.json', { encoding: 'utf-8', flag: 'r' })
        .then(data => {
            const boardGames = JSON.parse(data);
            const filterData = boardGames.filter(boardGame => boardGame.title.indexOf(title) != -1);
            return filterData;
        })
        .then(data => {
            res.send(JSON.stringify({
                code : 200,
                data
            }));
        })
        .catch(error => {
            console.error('file read failed : ', error);
        })

    /*
    const fileData = readFile('./public/json/boardgame.json');
    console.log('aa : ', fileData);
    const filterData = fileData.filter(data => data.title.indexOf(title) != -1);
    res.send(JSON.stringify({
        code : 200,
        filterData
    }));
    */
});

router.post('/post/register', (req, res, next) => {
    let username = req.body.username;
    console.log(username);
    updateFile('./public/json/test.json', [{ "username" : username }]);
    res.send(JSON.stringify({
        code : 200,
        you : username
    }));
});

module.exports = router;