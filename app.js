require("dotenv").config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true,useUnifiedTopology:true});

const userSchema = new mongoose.Schema({email: String,
  password:String
});



const User =new  mongoose.model("User",userSchema);


app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      email:req.body.username,
      password:hash
    });
    newUser.save(function(err){
      if(err){
        console.log("Error");
      }
      else{
        console.log("Successfully Registered");
        res.render("secrets");
      }
    });
});

});

app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username},function(err,data){
    if(err){
      console.log("Error while finding user");
    }
    else{
      if(data){
        console.log("User Exist");

        bcrypt.compare(password, data.password, function(err, result) {
          if(result == true){
            console.log("Password DO Match");
            res.render("secrets");
          }
          else{
          console.log("Password Do Not Match");
          }
        });
      }
      else{
        console.log("User does not exist");
      }
    }
  })
});

app.listen(3000,function(){
  console.log(" Server succesfully started ");
});
