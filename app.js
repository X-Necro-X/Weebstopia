const express = require('express');
const ejs = require("ejs");
const session=require('express-session')
const bodyParser=require('body-parser');
const mongoose=require("mongoose");

const app = express();
mongoose.connect("mongodb+srv://terminator:testdb@accounts-0uu7d.mongodb.net/Users",{useNewUrlParser:true,useUnifiedTopology: true});
app.set('view engine', 'ejs');
app.use(express.static('public/index'));

app.use(bodyParser.urlencoded({extended:true}));


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

app.get("/loginP",(req,res)=>{
    res.sendFile(__dirname+"/signin.html");
});

app.get('/', checklogin,(req, res) => {
    res.render('index');
});



app.get('/log',(req,res)=>{
    res.render('logout');
})
const loginUsers=new mongoose.Schema({
    email:String,
    password:String,
    fullName:String
});
const users=mongoose.model("user",loginUsers);
app.post('/login',(req,res)=>{
    const e=req.body.email;
    const p=req.body.pname;
    console.log(req.body,e,p);
    if(e&&p){
        users.findOne({email:e},function(err,user){
            console.log(user);
            if(user&&user.email===e&&user.password===p){
                req.session.userId=user.id;
                res.send({"successfull":true});
            }
            else{
                var k=0,j=0;
                if((user.email!==e))
                k=1;
                if((user.password!==p))
                j=1;
                res.send({"email":k,"password":j,"successfull":false});
            }
        });
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