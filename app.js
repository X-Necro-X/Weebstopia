const express = require('express');
const ejs = require("ejs");

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname+'/public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.listen(3000, () => {
    console.log("Server started!");
});