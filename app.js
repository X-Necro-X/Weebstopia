const express = require('express');
const ejs = require("ejs");
const session=require('express-session')
const bodyParser=require('body-parser');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public/index'));

app.use(bodyParser.urlencoded({extended:true}));

const users=[
    {id:1,email:'a@gmail.com',password:"test"}
];

app.use(session({
    saveUninitialized:false,
    secret:"domain",
    name:'login',
    resave:false,
    cookie: { 
        maxAge:1000*60*60*2,
        sameSite:true,
        secure: true
    }
}));

/*------------------Login---------------------*/

app.post("/loginP",(req,res)=>{
    res.sendFile(__dirname+"/signin.html");
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/log',(req,res)=>{
    res.render('logout');
})


app.post('/login',(req,res)=>{
    const e=req.body.email;
    const p=req.body.pname;
    console.log(req.body,e,p);
    if(e&&p){
        const user=users.find(user=>user.email===e && user.password===p);
        if(user){
            req.session.userId=user.id;
            return res.redirect('/log');
        }
        else{
            return res.redirect('/loginP');
        }
    }
});

app.post("/logOut",(req,res)=>{
    req.session.destroy(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.clearCookie("login");
        }
        return res.redirect("/");
    })
});

app.listen(3000, () => {
    console.log("Server started!");
});