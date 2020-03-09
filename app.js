const express = require('express');
const ejs = require("ejs");
const session = require('express-session')
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
var crypto = require('crypto');

const app = express();
mongoose.connect("mongodb+srv://terminator:testdb@accounts-0uu7d.mongodb.net/Users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({secret: "Shh, its a secret!"}));
app.set('view engine', 'ejs');
app.use(express.static('public/index'));

app.use(bodyParser.urlencoded({
    extended: true
}));

const loginUsers = new mongoose.Schema({
    email: String,
    password: String,
    fullName:String
});
const users = mongoose.model("user", loginUsers);


function saveUser(data,res) {
    users.findOne({
        email: data.email
    },function(err,user){
        if(!user)
        {
            const newUser = new users({
                fullName: data.fullName,
                email: data.email,
                password: crypto.createHash('sha256').update(data.password).digest('hex').toString()
            });
            newUser.save();
        }
        else{
            return res.redirect("/sign-up");
        }
    });
    
}

app.post('/sign-up', (req, res) => {
    res.render('sign-up');
});

app.post('/save-user', (req, res) => {
    saveUser(req.body,res);
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
    res.render('index');
});

app.get('/log', (req, res) => {
    console.log("gLog reqest", req.session);
    if(!req.session.uid)
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
            if(!user){
                res.send({"email":-1,"successfull": false});
            }
            else if (user.email === e && user.password === hvalue) {

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

app.listen(3000, () => {
    console.log("Server started!");
});