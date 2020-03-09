const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.static("public"));
app.use(fileUpload());



app.post('/upload', function (req, res) {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    let sampleFile = req.files.sampleFile;
    sampleFile.mv(__dirname + '/public/filename.jpg', function (err) {
        if (err)
            return res.status(500).send(err);

        res.send('File uploaded!');
    });
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/views/search.html');
});

app.post('/add/:id', function (req, res) {
    console.log(req.params.id);

});

app.listen('3000');