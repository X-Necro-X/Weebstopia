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
app.set('view engine', 'ejs');
app.use(express.static('public/index'));

app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    saveUninitialized: false,
    secret: "domain",
    name: 'login',
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2,
        sameSite: true,
        secure: true
    }
}));


/*------------------Login---------------------*/

/*app.use((req,res,next)=>{
    const { userId }=req.session
    if(userId){
        res.locals.user=users.find(
            user=>user.id===userId
        )
    }
    next();
})*/
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
    console.log(req.session);
    if(req.session.userId)
    res.render('logout');
    else
    res.redirect("/loginP");
});
const loginUsers = new mongoose.Schema({
    email: String,
    password: String,
});
const users = mongoose.model("user", loginUsers);
app.post('/login', (req, res) => {
    const e = req.body.email;
    const p = req.body.pname;
    var hvalue = crypto.createHash('sha256').update(p).digest('hex').toString();
    console.log(req.body, e, hvalue);
    if (e && p) {
        users.findOne({
            email: e
        }, function (err, user) {
            console.log(user);
            var k = 0,
            j = 0;
            if(!user)
            {
                res.send({
                    "email": -1,
                    "successfull": false
                });
            }
            else if (user.email === e && user.password === hvalue) {
                req.session.userId = user.id;
                console.log(req.session);
                res.send({
                    "successfull": true
                });
            } else {
                if ((user.email !== e))
                    k = 1;
                if ((user.password !== p))
                    j = 1;
                if ((user.password !== p)&&(user.email !== e))
                    j=1,k=1;
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
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.clearCookie("login");
        }
        res.redirect("/");
    });
});

app.listen(3000, () => {
    console.log("Server started!");
});