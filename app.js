// -------------------------------------------------- start -------------------------------------------------- //


const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const crypto = require('crypto');
const MongoStore = require('connect-mongo')(session);
const upload = require('express-fileupload');
const fs = require('fs').promises;


// -------------------------------------------------- server settings -------------------------------------------------- //


const app = express();
mongoose.connect('mongodb+srv://admin-necro:2634662@accounts-0uu7d.mongodb.net/Users', {
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
app.use(express.static('public'));
app.use(express.static('public/index'));
app.use(express.static('public/log-in'));
app.use(express.static('public/profile'));
app.use(express.static('public/search'));
app.use(express.static('public/settings'));
app.use(express.static('public/sign-up'));
app.use(express.static('public/upload'));
app.use(express.static('public/view-profile'));
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
const detail = mongoose.model('detail', userDetail);
app.use(upload({
    safeFileNames: true,
    preserveExtension: true
}));


// -------------------------------------------------- root route -------------------------------------------------- //


app.get('/', (req, res) => {
    if (!req.session.uid) {
        res.render('index');
    } else {
        detail.findById(req.session.uid, (err, user) => {
            res.render('profile', {
                details: user
            });
        });
    }
});


// -------------------------------------------------- sign-up routes -------------------------------------------------- //


app.get('/sign-up', (req, res) => {
    if (!req.session.uid) {
        res.render('sign-up', {
            message: '',
            bg: 'bg-white',
            text: 'text-secondary'
        });
    } else {
        res.redirect('/');
    }
});

app.post('/save-user', (req, res) => {
    detail.findOne({
        userName: req.body.userName
    }, (err, found) => {
        if (found) {
            res.render('sign-up', {
                message: 'User name already exists!',
                bg: 'bg-danger',
                text: 'text-white'
            });
        } else {
            detail.findOne({
                email: req.body.email
            }, (err, user) => {
                if (!user) {
                    const newUser = new detail({
                        fullName: req.body.fullName,
                        userName: req.body.userName,
                        email: req.body.email,
                        password: crypto.createHash('sha256').update(req.body.password).digest('hex').toString(),
                        profilePic: 'profile-pic-default.png'
                    });
                    newUser.save();
                    req.session.uid = newUser._id;
                    req.session.uun = newUser.userName;
                    req.session.upp = newUser.profilePic;
                    if (req.body.remember == 'true') {
                        req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                    }
                    req.session.save(() => {
                        res.redirect('/');
                    });
                } else {
                    res.render('log-in', {
                        message: 'You already have an account!',
                        bg: 'bg-warning',
                        text: 'text-white'
                    });
                }
            });
        }
    });
});


// -------------------------------------------------- log-in routes -------------------------------------------------- //


app.get('/log-in', (req, res) => {
    if (!req.session.uid) {
        res.render('log-in', {
            message: '',
            bg: 'bg-white',
            text: 'text-secondary'
        });
    } else {
        res.redirect('/');
    }
});

app.post('/check-user', (req, res) => {
    const password = crypto.createHash('sha256').update(req.body.password).digest('hex').toString();
    detail.findOne({
        userName: req.body.userName
    }, (err, user) => {
        if (user && user.password == password) {
            req.session.uid = user._id;
            req.session.uun = user.userName;
            req.session.upp = user.profilePic;
            if (req.body.remember == 'true') {
                req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
            }
            req.session.save(() => {
                res.redirect('/');
            });
        } else {
            res.render('log-in', {
                message: 'Incorrect user name or password!',
                bg: 'bg-danger',
                text: 'text-white'
            });
        }
    });
});

app.get('/log-out', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});


// -------------------------------------------------- settings routes -------------------------------------------------- //


app.get('/settings', (req, res) => {
    if (!req.session.uid) {
        res.redirect('/');
    } else {
        detail.findById(req.session.uid, (err, user) => {
            res.render('settings', {
                message: [''],
                bg: 'bg-white',
                text: 'text-secondary',
                details: user
            });
        });
    }
});

app.post('/save-settings', async (req, res) => {
    var message = [],
        bg = [],
        text = [];
    const user = await detail.findById(req.session.uid);
    if (!(req.body.newp1 == '' && req.body.newp2 == '')) {
        if (crypto.createHash('sha256').update(req.body.oldp).digest('hex').toString() != user.password) {
            message.push('Incorrect Password!');
            bg.push('bg-danger');
            text.push('text-white');
        } else if (req.body.newp1 != req.body.newp2) {
            message.push('Passwords do not match!');
            bg.push('bg-danger');
            text.push('text-white');
        } else {
            message.push('Password updated successfully!');
            bg.push('bg-success');
            text.push('text-white');
            user.password = crypto.createHash('sha256').update(req.body.newp1).digest('hex').toString();
        }
    }
    if (req.body.email != user.email) {
        const found = await detail.findOne({
            email: req.body.email
        });
        if (found) {
            message.push('Account with that e-mail already exists!');
            bg.push('bg-danger');
            text.push('text-white');
        } else {
            message.push('E-mail updated successfully!');
            bg.push('bg-success');
            text.push('text-white');
            user.email = req.body.email;
        }
    }
    if (req.body.userName != user.userName) {
        const found = await detail.findOne({
            userName: req.body.userName
        });
        if (found) {
            message.push('Account with that user name already exists!');
            bg.push('bg-danger');
            text.push('text-white');
        } else {
            message.push('User name updated successfully!');
            bg.push('bg-success');
            text.push('text-white');
            user.userName = req.body.userName;
        }
    }
    if (req.files) {
        const pic = req.files.profilePic;
        if (req.session.upp != 'profile-pic-default.png') {
            fs.unlink(__dirname + '/public/upload/' + req.session.upp);
        }
        pic.name = 'profile-pic-' + req.session.uun + '-' + pic.name;
        await pic.mv(__dirname + '/public/upload/' + pic.name);
        message.push('Profile picture updated successfully!');
        bg.push('bg-success');
        text.push('text-white');
        user.profilePic = pic.name;
    }
    await detail.updateOne({
        _id: user._id
    }, user);
    req.session.upp = user.profilePic;
    req.session.uun = user.userName;
    req.session.save(() => {
        detail.findById(req.session.uid, (err, user) => {
            res.render('settings', {
                message: message,
                bg: bg,
                text: text,
                details: user
            });
        });
    });
});

app.post('/delete-account', async (req, res) => {
    if (req.session.upp != 'profile-pic-default.png') {
        fs.unlink(__dirname + '/public/upload/' + req.session.upp);
    }
    await detail.findByIdAndDelete(req.session.uid);
    res.redirect('/log-out');
});


// -------------------------------------------------- search routes -------------------------------------------------- //


app.get('/search-user', (req, res) => {
    res.render('search');
});

app.post('/search-user', (req, res) => {
    detail.find({
        fullName: new RegExp(req.body.userSearch, 'i')
    }, (err, user) => {
        res.send(user);
    });
});

app.get('/users/:userName', (req, res) => {
    detail.findOne({
        userName: req.params.userName
    }, (err, user) => {
        res.render('view-profile', {
            details: user
        });
    });
});


// -------------------------------------------------- listen -------------------------------------------------- //


app.listen(3000, () => {
    console.log('Server started!');
});


// -------------------------------------------------- end -------------------------------------------------- //