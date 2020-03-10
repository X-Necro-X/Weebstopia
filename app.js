// imports

const express = require('express');
const ejs = require("ejs");
const session = require('express-session')
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
var crypto = require('crypto');

// settings

const app = express();
mongoose.connect("mongodb+srv://admin-necro:2634662@accounts-0uu7d.mongodb.net/Users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: "Anime is love, anime is life.",
    resave: true,
    saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public/index'));
app.use(express.static('public/search'));
app.use(bodyParser.urlencoded({
    extended: true
}));

// mongoDB settings

const logIn = new mongoose.Schema({
    fullName: String,
    userName: String,
    email: String,
    password: String
});
const userLogin = mongoose.model("userLogin", logIn);

// root route

app.get('/', (req, res) => {
    if (req.session.uid)
        res.render('profile');
    else
        res.render('index');
});

// sign-up routes and functions

app.get('/sign-up', (req, res) => {
    res.render('sign-up', {
        message: "Please Sign Up!"
    });
});

app.post('/save-user', (req, res) => {
    var result = checkUserName(req.body.userName);
    if (result == true)
        res.render('sign-up', {
            message: "User name already exists!"
        });
    else {
        result = saveUser(req.body);
        if (result == true)
            res.render('profile');
        else
            res.render('log-in', {
                message: "You already have an account!"
            });
    }
});

function checkUserName(uName) {
    userLogin.findOne({
        userName: uName
    }, (err, user) => {
        if (user)
            return true;
        else
            return false;
    });
}

function saveUser(data) {
    userLogin.findOne({
        email: data.email
    }, (err, user) => {
        if (!user) {
            const newUser = new userLogin({
                fullName: data.fullName,
                userName: data.userName,
                email: data.email,
                password: crypto.createHash('sha256').update(data.password).digest('hex').toString()
            });
            newUser.save();
            return true;
        } else {
            return false;
        }
    });
}

// log-in routes and functions

app.get("/log-in", (req, res) => {
    res.render("log-in", {
        message: "Please Login to continue!"
    });
});

app.post('/check-user', (req, res) => {
    var uName = req.body.userName;
    var password = req.body.pswrd;
    var check = req.body.remember;
    password = crypto.createHash('sha256').update(password).digest('hex').toString();
    if (uName && password) {
        userLogin.findOne({
            userName: uName
        }, (err, user) => {
            if (user) {
                if (user.password == password) {
                    res.render('profile');
                    if (check == "true") {
                        req.session.cookie({
                            maxAge: 365 * 24 * 60 * 60 * 1000
                        });
                    }
                } else
                    res.render('log-in', {
                        message: "Incorrect Password!"
                    });
            }
            else{
                res.render('sign-up', { message: "You have to sign up first" });
            }
        });
    } else {
        res.render('log-in', {
            message: "Please fill both the fields!"
        });
    }
});

app.get("/log-out", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// /*--------------search user-------------------*/

// app.get('/search-user', (req, res) => {
//     res.render('search');
// });

// app.post('/searchuser', (req, res) => {
//     console.log(req.body.temp);
//     userLogin.find({
//         fullName: new RegExp(req.body.temp, "i")
//     }, function (err, user) {
//         console.log(user);
//         res.send(user);
//     });
// });

// // /*-------------------show profile-----------------------*/

// app.post('/showprofile', (req, res) => {
//     console.log(req.body);
//     userLogin.findOne({
//         _id: req.body["hello"]
//     }, function (err, user) {
//         res.redirect("/" + userLoginfullName)
//         console.log(user);
//     });
// });

// app.get("/:customListName", function (req, res) {
//     userLogin.findOne({
//         fullName: req.params.customListName
//     }, function (err, results) {
//         if (!err) {
//             if (!results) {
//                 res.redirect("/");
//             } else {
//                 res.render("profile", {
//                     name: results.fullName,
//                     image: results.image
//                 });
//             }
//         }
//     });
//     console.log(req.params.customListName);
// });











// /*------------register user--------------------*/




// app.get('/profile', (req, res) => {
//     userLogin.findOne({
//         _id: req.session.uid
//     }, (err, user) => {
//         if (user) {

//         }
//     });
// });

// app.post('/upload', function (req, res) {
//     if (!req.files || Object.keys(req.files).length === 0) {
//         return res.status(400).send('No files were uploaded.');
//     }
//     let sampleFile = req.files.sampleFile;
//     sampleFile.mv(__dirname + '/public/' + req.session.uid + '.jpg', function (err) {
//         if (err)
//             return res.status(500).send(err);

//         res.redirect('/profile');
//     });
// });

// listen

app.listen(3000, () => {
    console.log("Server started!");
});