// imports

const express = require('express');
const ejs = require("ejs");
const session = require('express-session')
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const crypto = require('crypto');
const MongoStore = require('connect-mongo')(session);
const upload = require('express-fileupload');
const fs = require('fs');

// server settings

const app = express();
mongoose.connect("mongodb+srv://admin-necro:2634662@accounts-0uu7d.mongodb.net/Users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: "I'll Take A Potato Chip... And Eat It!",
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        touchAfter: 3600
    })
}));
app.set('view engine', 'ejs');
app.use(express.static('public/index'));
app.use(express.static('public/log-in'));
app.use(express.static('public/profile'));
app.use(express.static('public/search'));
app.use(express.static('public/sign-up'));
app.use(express.static('public/upload'));
app.use(bodyParser.urlencoded({
    extended: true
}));
const userDetail = new mongoose.Schema({
    fullName: String,
    userName: String,
    email: String,
    password: String,
    profilePic: String
});
const detail = mongoose.model("detail", userDetail);
app.use(upload({
    safeFileNames: true,
    preserveExtension: true
}));

// root route

app.get('/', async (req, res) => {
    if (!req.session.uid)
        res.render('index');
    else
        res.render('profile', {
            details: await findUser(req.session.uid)
        });
});

// sign-up routes

app.get('/sign-up', async (req, res) => {
    if (!req.session.uid)
        res.render('sign-up', {
            message: "Please Sign Up!"
        });
    else
        res.render('profile', {
            details: await findUser(req.session.uid)
        });
});

app.post('/save-user', (req, res) => {
    detail.findOne({
        userName: req.body.userName
    }, (err, user) => {
        if (user)
            res.render('sign-up', {
                message: "User name already exists!"
            });
        else {
            detail.findOne({
                email: req.body.email
            }, (err, user) => {
                if (!user) {
                    const newUser = new detail({
                        fullName: req.body.fullName,
                        userName: req.body.userName,
                        email: req.body.email,
                        password: crypto.createHash('sha256').update(req.body.password).digest('hex').toString(),
                        profilePic: "profile-pic-default.png"
                    });
                    newUser.save();
                    req.session.uid = newUser._id;
                    req.session.uun = newUser.userName;
                    req.session.upp = newUser.profilePic;
                    if (req.body.remember == "true")
                        req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                    res.render('profile', {
                        details: newUser
                    });
                } else
                    res.render('log-in', {
                        message: "You already have an account!"
                    });
            });
        }
    });
});

// log-in routes

app.get("/log-in", async (req, res) => {
    if (!req.session.uid)
        res.render("log-in", {
            message: "Please Login to continue!"
        });
    else
        res.render('profile', {
            details: await findUser(req.session.uid)
        });
});

app.post('/check-user', (req, res) => {
    var password = req.body.pswrd;
    password = crypto.createHash('sha256').update(password).digest('hex').toString();
    detail.findOne({
        userName: req.body.userName
    }, (err, user) => {
        if (user) {
            if (user.password == password) {
                req.session.uid = user._id;
                req.session.uun = user.userName;
                req.session.upp = user.profilePic;
                if (req.body.remember == "true") {
                    req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                }
                res.render('profile', {
                    details: user
                });
            } else {
                res.render('log-in', {
                    message: "Incorrect Password!"
                });
            }
        } else
            res.render('sign-up', {
                message: "You have to sign up first!"
            });
    });
});

app.get("/log-out", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

// settings routes

app.get('/settings', async (req, res) => {
    if (!req.session.uid)
        res.render("log-in", {
            message: "Please Login to continue!"
        });
    else
        res.render('settings', {
            message: "",
            details: await findUser(req.session.uid)
        });
});

app.post('/save-settings', async (req, res) => {
    var message = "";
    const user = await findUser(req.session.uid);
    if (!(req.body.newp1 == "" && req.body.newp2 == "")) {
        if (crypto.createHash('sha256').update(req.body.oldp).digest('hex').toString() != user.password)
            message += "Incorrect Password!...";
        else if (req.body.newp1 != req.body.newp2)
            message += "Passwords do not match!...";
        else {
            message += "Password updated successfully!...";
            user.password = crypto.createHash('sha256').update(req.body.newp1).digest('hex').toString();
        }
    }
    if (req.body.email != user.email) {
        var found = await detail.findOne({
            email: req.body.email
        });
        if (found)
            message += "Account with that e-mail already exists!...";
        else {
            message += "E-mail updated successfully!...";
            user.email = req.body.email;
        }
    }
    if (req.body.userName != user.userName) {
        var found = await detail.findOne({
            userName: req.body.userName
        });
        if (found)
            message += "Account with that user name already exists!...";
        else {
            message += "User name updated successfully!...";
            user.userName = req.body.userName;
            req.session.uun = req.body.userName;
        }
    }
    if (req.files) {
        const pic = req.files.profilePic;
        if (req.session.upp != "profile-pic-default.png")
            fs.unlink(__dirname + "/public/upload/" + req.session.upp, () => {});
        pic.name = "profile-pic-" + req.session.uun + "-" + pic.name;
        pic.mv(__dirname + "/public/upload/" + pic.name);
        message += "Profile picture updated successfully...";
        user.profilePic = pic.name;
        req.session.upp = pic.name;
    }
    await detail.updateOne({
        _id: user._id
    }, user);
    res.render('settings', {
        message: message,
        details: await findUser(req.session.uid)
    });
});

// search routes

app.get('/search-user', (req, res) => {
    res.render('search');
});

app.post('/search-user', async (req, res) => {
    const user = await detail.find({
        fullName: new RegExp(req.body.userSearch, "i")
    });
    res.send(user);
});

app.get("/users/:userName", async (req, res) => {
    const user = await detail.findOne({
        userName: req.params.userName
    });    
    res.render("view-profile", {
        details: user
    });
});

// functions

function findUser(uid) {
    return new Promise((resolve, reject) => {
        detail.findById(uid, (err, user) => {
            if (err)
                reject(err);
            else
                resolve(user);
        });
    });
}

// listen

app.listen(3000, () => {
    console.log("Server started!");
});