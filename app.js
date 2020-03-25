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
const dotenv = require('dotenv');
const jwt = require('jwt-simple');
const nodemailer = require('nodemailer');


// -------------------------------------------------- server settings -------------------------------------------------- //


const app = express();
dotenv.config();
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        touchAfter: 3600
    })
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static('public/upload'));
app.use(bodyParser.urlencoded({
    extended: true
}));
const userDetail = new mongoose.Schema({
    fullName: String,
    userName: String,
    email: String,
    password: String,
    profilePic: String,
    followers: Array,
    following: Array
});
const detail = mongoose.model('detail', userDetail);
app.use(upload());
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD
    }
});


// -------------------------------------------------- root routes -------------------------------------------------- //


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
            bg: '',
            text: ''
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
            bg: '',
            text: ''
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
                bg: '',
                text: '',
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
    await detail.updateMany({
        followers: {
            $in: [req.session.uid]
        }
    }, {
        $pull: {
            followers: req.session.uid
        }
    });
    await detail.updateMany({
        following: {
            $in: [req.session.uid]
        }
    }, {
        $pull: {
            following: req.session.uid
        }
    });
    if (req.session.upp != 'profile-pic-default.png') {
        fs.unlink(__dirname + '/public/upload/' + req.session.upp);
    }
    await detail.findByIdAndDelete(req.session.uid, () => {
        res.redirect('/log-out');
    });
});


// -------------------------------------------------- search routes -------------------------------------------------- //


app.get('/search', (req, res) => {
    if (!req.session.uid) {
        res.redirect('/');
    } else {
        res.render('search');
    }
});

app.post('/search-user', (req, res) => {
    detail.find({
        fullName: new RegExp(req.body.userSearch, 'i')
    }, (err, user) => {
        res.send(user);
    });
});

app.get('/users/:userName', (req, res) => {
    if (!req.session.uid) {
        res.redirect('/');
    } else {
        if (req.session.uun == req.params.userName) {
            res.redirect('/');
        } else {
            detail.findOne({
                userName: req.params.userName
            }, (err, user) => {
                if (user) {
                    res.render('view-profile', {
                        details: user,
                        follows: user.followers.indexOf(req.session.uid)
                    });
                } else {
                    res.redirect('*');
                }
            });
        }
    }
});


// -------------------------------------------------- profile routes -------------------------------------------------- //


app.post('/follow-user', async (req, res) => {
    if (req.body.follows == '-1') {
        await detail.updateOne({
            _id: req.session.uid
        }, {
            $push: {
                following: req.body.id
            }
        });
        detail.updateOne({
            _id: req.body.id
        }, {
            $push: {
                followers: req.session.uid
            }
        }, () => {
            res.send('1');
        });
    } else {
        await detail.updateOne({
            _id: req.session.uid
        }, {
            $pull: {
                following: req.body.id
            }
        });
        detail.updateOne({
            _id: req.body.id
        }, {
            $pull: {
                followers: req.session.uid
            }
        }, () => {
            res.send('-1');
        });
    }
});


// -------------------------------------------------- password reset routes -------------------------------------------------- //


app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        message: '',
        verified: 0,
        bg: '',
        text: ''
    });
});

app.post('/forgot-password-email', (req, res) => {
    detail.findOne({
        email: req.body.email
    }, async (err, user) => {
        if (user) {
            const payload = {
                id: user._id,
                email: user.email
            };
            const secret = user.password + '-' + user._id.getTimestamp() + '-' + process.env.JWT_SECRET;
            const token = jwt.encode(payload, secret);
            ejs.renderFile(__dirname + '/views/reset-password-mail.ejs', {
                userName: user.userName,
                pid: payload.id,
                token: token
            }, (err, mail) => {
                const mailOptions = {
                    from: process.env.GMAIL_ID,
                    to: user.email,
                    subject: 'Weebstopia Password Reset',
                    html: mail
                }
                transporter.sendMail(mailOptions, function (error, info) {
                    if (!error) {
                        res.render('forgot-password', {
                            message: 'An email has been sent. Please click on the link when you get it.',
                            verified: 1,
                            bg: 'bg-white',
                            text: 'text-secondary'
                        });
                    }
                });
            });
        } else {
            res.render('forgot-password', {
                message: 'Sorry, there is no user with that email.',
                verified: 0,
                bg: 'bg-danger',
                text: 'text-white'
            });
        }
    });
});

app.get('/reset-password/:id/:token', (req, res) => {
    var valid = 1,
        payload;
    detail.findById(req.params.id, (err, user) => {
        const secret = user.password + '-' + user._id.getTimestamp() + '-' + process.env.JWT_SECRET;
        try {
            payload = jwt.decode(req.params.token, secret);
        } catch (err) {
            valid = 0;
        } finally {
            if (valid) {
                res.render('reset-password-page', {
                    pid: payload.id,
                    token: req.params.token
                });
            } else {
                res.render('reset-password-page', {
                    pid: 'null',
                    token: 'invalid'
                });
            }
        }
    });
});

app.post('/reset-password', function (req, res) {
    var valid = 1;
    detail.findById(req.body.id, (err, user) => {
        const secret = user.password + '-' + user._id.getTimestamp() + '-' + process.env.JWT_SECRET;
        try {
            const payload = jwt.decode(req.body.token, secret);
        } catch (err) {
            valid = 0;
        } finally {
            if (valid) {
                password = crypto.createHash('sha256').update(req.body.password).digest('hex').toString();
                user.password = password;
                detail.updateOne({
                    _id: req.body.id
                }, user, () => {
                    res.render('log-in', {
                        message: 'Password reset was successful! Please login to continue!',
                        bg: 'bg-warning',
                        text: 'text-white'
                    });
                });
            } else {
                res.render('reset-password-page', {
                    pid: 'null',
                    token: 'invalid'
                });
            }
        }
    });
});


// -------------------------------------------------- listen -------------------------------------------------- //


app.listen(3000, () => {
    console.log('Server started!');
});


// -------------------------------------------------- end -------------------------------------------------- //
app.get('/p', (req, res) => {
    detail.find((err, user) => {

        res.send(user)
    });
});


app.get('*', (req, res) => {
    res.render('404');
});