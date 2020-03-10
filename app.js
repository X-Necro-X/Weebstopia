
/*------------------------Require modules------------------------*/

const express = require('express');
const ejs = require("ejs");
const session = require('express-session')
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
var crypto = require('crypto');

/*------------------------Initialize Modules-------------------------*/

const app = express();
mongoose.connect("mongodb+srv://terminator:testdb@accounts-0uu7d.mongodb.net/Users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: "Shh, its a secret!",
    resave: true,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public/index'));
app.use(express.static('public/upload'));

app.use(bodyParser.urlencoded({
    extended: true
}));

/*--------------Create schema for mongodb---------------------*/

const loginUsers = new mongoose.Schema({
    email: String,
    password: String,
    fullName:String,
    image:String
});
const users = mongoose.model("user", loginUsers);


/*------------register user--------------------*/


function saveUser(data, res) {
    users.findOne({
        email: data.email
    }, function (err, user) {
        if (!user) {
            const newUser = new users({
                fullName: data.fullName,
                email: data.email,
                password: crypto.createHash('sha256').update(data.password).digest('hex').toString()
            });
            newUser.save();
        } else {
            return res.redirect("/sign-up");
        }
    });

}

/*--------------search user-------------------*/


app.post('/search', (req, res) => {
    res.render('search');
});

app.post('/searchuser',(req,res)=>{
    console.log(req.body.temp);
    users.find({fullName: new RegExp(req.body.temp, "i")},function(err,user){
            console.log(user);
            res.send(user);
    });
});

/*-------------------show profile-----------------------*/

app.post('/showprofile',(req,res)=>{
    console.log(req.body);
    users.findOne({_id: req.body["hello"]},function(err,user){
        res.redirect("/"+user.fullName)
        console.log(user);
});
});

app.get("/:customListName",function(req,res){
    users.findOne({fullName:req.params.customListName},function(err,results){
        if(!err){
            if(!results){
                res.redirect("/");
            } else {
                res.render("profile", {
                    name: results.fullName,
                    image: results.image
                });
            }
        }
    });
    console.log(req.params.customListName);
});


/*---------------------sign up---------------------*/

app.post('/sign-up', (req, res) => {
    res.render('sign-up');
});

app.post('/save-user', (req, res) => {
    saveUser(req.body, res);
    res.redirect("/loginP");
});

/*------------------Login---------------------*/


app.post("/loginP", (req, res) => {
    res.sendFile(__dirname + "/signin.html");
});

app.get("/loginP", (req, res) => {
    res.sendFile(__dirname + "/signin.html");
});

app.get('/', (req, res) => {
    if(req.session.uid)
    res.render('logout');
    else
    res.render('index');
});

app.get('/log', (req, res) => {
    console.log("gLog reqest", req.session);
    if (!req.session.uid)
        return res.redirect("/loginP")
    res.render('logout');
});
app.post('/login', (req, res) => {
    const e = req.body.email;
    const p = req.body.pname;
    var hvalue = crypto.createHash('sha256').update(p).digest('hex').toString();
    console.log(req.body, e, hvalue);
    if (e && p) {
        users.findOne({
            email: e
        }, function (err, user) {
            var k = 0,
                j = 0;
            console.log(user);
            if (!user) {
                res.send({
                    "email": -1,
                    "successfull": false
                });
            } else if (user.email === e && user.password === hvalue) {

                req.session.uid = user.id;
                console.log("setting cookie", req.session, user);
                res.send({
                    "successfull": true
                });

            } else {
                if ((user.email !== e))
                    k = 1;
                if ((user.password !== p))
                    j = 1;
                res.send({
                    "email": k,
                    "password": j,
                    "successfull": false
                });
            }
        });
    }
});

app.post("/logOut", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

/*----------starting server-----------------*/

app.listen(3000, () => {
    console.log("Server started!");
});