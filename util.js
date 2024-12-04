module.exports = {
  token: 'hwQOaL12@i*DIi-_zws-DMV*vMrCu0YiI9JV*=JG7-IaRf3tot',
  pathGame: './public/json/boardgame.json',
  pathUser: './public/json/user.json',
  pathReview: './public/json/review.json',
  pathPost: './public/json/post.json',
  pathSlider: './public/json/sliderlist.json',
  updateFile: async (fs, path, data) => {
    try {
      const fileData = await fs.readFile(path, {
        encoding: 'utf-8',
        flag: 'r',
      });
      const jsonData = JSON.parse(fileData);
      const updatedFileData = {
        lastid: jsonData.lastid + 1,
        data: [...jsonData.data, { id: jsonData.lastid + 1, ...data }],
      };
      await fs.writeFile(path, JSON.stringify(updatedFileData, null, 2), {
        encoding: 'utf-8',
        flag: 'w',
      });
      return 'file updated';
    } catch (error) {
      console.error('file update failed : ', error);
    }
  },
  sendAllData: (fs, res, path) => {
    fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
      .then((data) => JSON.parse(data).data)
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
  },
  sendDataFindById: (fs, res, path, id) => {
    fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
      .then((data) => JSON.parse(data).data.find((item) => item.id === id))
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
  },
  sendFilterData: (fs, res, path, filterFunc) => {
    fs.readFile(path, { encoding: 'utf-8', flag: 'r' })
      .then((data) => JSON.parse(data).data.filter((item) => filterFunc(item)))
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
  },
};
