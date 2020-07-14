var router = require('express').Router();
var mongoose = require('mongoose');

const mongoURI ="mongodb+srv://test:12qwaszx@cluster0-l90om.mongodb.net/test?retryWrites=true&w=majority";

const conn = mongoose.createConnection(mongoURI);
let gfs
const Grid = require("gridfs-stream");


conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo)
  gfs.collection('uploads')
  console.log('Connection Successful')
});

router.get('/:filename', (req, res) => {
    console.log(req.params);
    console.log()
    gfs.files.findOne({ filename: "http://alphanetwork.herokuapp.com/api/load/"+req.params.filename }, (err, file) => {
      // http://192.168.43.99:3000/api/load/
      // Check if file
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists',
        })
      }
  
      // Check if image
      // if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
        // Read output to browser
        const readstream = gfs.createReadStream(file.filename)
        readstream.pipe(res)
      // } 
      // else {
      //   res.status(404).json({
      //     err: 'Not an image',
      //   })
      // }
    })
  });

  module.exports = router;