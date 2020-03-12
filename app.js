// imports

const express = require('express');
const ejs = require("ejs");
const session = require('express-session')
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const crypto = require('crypto');
const MongoStore = require('connect-mongo')(session);
// const fs=require('fs');
// const upload=require('express-fileupload');
// const path = require('path');

// server settings

const app = express();
mongoose.connect("mongodb+srv://admin-necro:2634662@accounts-0uu7d.mongodb.net/Users", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(session({
    secret: "Anime is love, anime is life.",
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
app.use(express.static('public/sign-up'));
app.use(bodyParser.urlencoded({
    extended: true
}));
const logIn = new mongoose.Schema({
    fullName: String,
    userName: String,
    email: String,
    password: String
});
const detail = mongoose.model("detail", logIn);
// app.use(upload());

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
        if (user) {
            res.render('sign-up', {
                message: "User name already exists!"
            });
        } else {
            const data = req.body;
            detail.findOne({
                email: data.email
            }, (err, user) => {
                if (!user) {
                    const newUser = new detail({
                        fullName: data.fullName,
                        userName: data.userName,
                        email: data.email,
                        password: crypto.createHash('sha256').update(data.password).digest('hex').toString()
                    });
                    newUser.save();
                    if (req.body.remember == "true") {
                        req.session.uid = newUser._id;
                        req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                        req.session.expires = 365 * 24 * 60 * 60 * 1000;
                    }
                    res.render('profile', {
                        details: newUser
                    });
                } else {
                    res.render('log-in', {
                        message: "You already have an account!"
                    });
                }
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
                if (req.body.remember == "true") {
                    req.session.uid = user._id;
                    req.session.cookie.maxAge = 365 * 24 * 60 * 60 * 1000;
                    req.session.expires = 365 * 24 * 60 * 60 * 1000;
                }
                res.render('profile', {
                    details: user
                });
            } else {
                res.render('log-in', {
                    message: "Incorrect Password!"
                });
            }
        } else {
            res.render('sign-up', {
                message: "You have to sign up first!"
            });
        }
    });
});

app.get("/log-out", (req, res) => {
    req.session.destroy();
    res.redirect("/");
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

// app.get('/settings',function(req,res){
//     if(req.session.uid)
//     {
//         console.log(req.session);
//         res.render("settings",{img:req.session.img});
//     }
//     else{
//         res.redirect("/loginP");
//     }
// });
// var file;
// var flag=0;
// app.post('/download',function(req,res){
//     if(req.files)
//     {
//         console.log(req.files);
//         file=req.files.myfile;
//         file.name="d04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fa"+file.name;
//         file.mv("./downloads/"+file.name,function(err){
//             if(err)
//             res.send("Error");
//             else
//             res.render('settings',{img:file.name});
//         });
//     }
//     else{
//         file=req.files;
//     }
// });


// app.post('/saveprofile',function(req,res){
//     if(!file)
//     return setTimeout(function(){ res.redirect("/"); }, 3000);
//     var index;
//     for(i=file.name.length-1;i>=0;i--)
//     if(file.name[i]=='.')
//     {
//         index=i;
//         break;
//     }
//     var indextemp;
//     var filenametemp=req.session.img;
//     for(i=filenametemp.length-1;i>=0;i--)
//     if(filenametemp[i]=='.')
//     {
//         indextemp=i;
//         break;
//     }
//     file.name=req.session.img.slice(0,indextemp)+file.name.slice(index);
//     fs.unlink('./public/upload/'+req.session.img, (err) => {
//         if (err) throw err;
//         console.log('successfully deleted image');
//       });
//       req.session.img=file.name;
//     file.mv("./public/upload/"+file.name,function(err){
//         if(err)
//         res.send("Error");
//         else
//         res.render('settings',{img:file.name});
//     });
//     const directory = './downloads/';
//     fs.readdir(directory, (err, files) => {
//     if (err) throw err;

//     for (const f of files) {
//         fs.unlink(path.join(directory, f), err => {
//         if (err) throw err;
//         });
//     }
//     });
//     users.updateOne({_id:req.session.uid}, { $set: { image: req.session.img } },function(err,user){
//         console.log(user);
//     });
//     res.redirect("/");
// });

// app.post('/search', (req, res) => {
//     res.render('search');
// });

// app.post('/searchuser',(req,res)=>{
//     console.log(req.body.temp);
//     users.find({fullName: new RegExp(req.body.temp, "i")},function(err,user){
//             console.log(user);
//             res.send(user);
//     });
// });

// app.post('/showprofile',(req,res)=>{
//     console.log(req.body);
//     users.findOne({_id: req.body["hello"]},function(err,user){
//         res.redirect("/"+user.fullName)
//         console.log(user);
// });
// });

// app.get("/:customListName",function(req,res){
//     users.findOne({fullName:req.params.customListName},function(err,results){
//         if(!err){
//             if(!results){
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
