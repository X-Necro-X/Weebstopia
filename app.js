const express = require('express');

const app = express();
app.use(express.static("public"));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/search.html');
});

app.post('/add/:id', function(req, res){
    console.log(req.params.id);
    
});

app.listen('3000');