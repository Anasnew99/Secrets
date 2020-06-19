require("dotenv").config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(session({
  secret: process.env.LOCAL_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://anasnew99:Anas1234%40@db-yngue.mongodb.net/secretDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const secretSchema = new mongoose.Schema({
  secret:String
});

const Secret = new mongoose.model("Secret",secretSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId: String,
  facebookId: String,
  secretIds:[String]
});
userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


app.get("/", function(req, res) {
  if (req.isAuthenticated()) {

    res.redirect("/secrets");
    console.log("Already Logged IN");
  } else {
    res.render("home");
  }

});

app.get("/login", function(req, res) {
  if (req.isAuthenticated()) {

    res.redirect("/secrets");
    console.log("Already Logged IN");
  } else {
    res.render("login");
  }

});

app.get("/register", function(req, res) {
  if (req.isAuthenticated()) {

    res.redirect("/secrets");
    console.log("Already Logged IN First LogOut And Then Register Again");
  } else {
    res.render("register");
  }
});

app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (!err) {

      passport.authenticate("local")(req, res, function() {
        res.redirect('/secrets');
        console.log("Succsefully Registered");
      });

    } else {
      console.log(err);
      res.redirect('/register');
    }
  });

});


app.post("/login", function(req, res) {
  user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (!err) {
      passport.authenticate('local')(req, res, function() {
        res.redirect("/secrets");
        console.log("User Logged In");
      });
    } else {
      console.log("Error");
    }
  });
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/secrets", function(req, res) {

  if (req.isAuthenticated()) {
    Secret.find(function(err,secrets){
      if(!err){
        if(secrets){
          res.render("secrets",{secrets:secrets,secretIdsOfUser:req.user.secretIds});

        }
        else{
          console.log("No Secrets");
        }
      }else{
        console.log(err);
      }
    });
  } else {
    console.log("Not logged In");
    res.redirect("/login");
  }
});

app.get('/submit',function(req,res){
  if(req.isAuthenticated()){
    res.render('submit');
  }else{
    res.redirect('/login');
  }
});

app.post('/submit',function(req,res){
  if(req.isAuthenticated()){
    const secret = new Secret({secret:req.body.secret});
    secret.save(function(err,data){
      if(!err){
        User.findById(req.user._id,function(err,foundUser){
          if(!err){
            if(foundUser){
              foundUser.secretIds.push(data._id);
              foundUser.save(function(err){
                if(!err){
                  res.redirect('/secrets');
                  console.log("Succesfully Saved to database");
                }
                else{
                  console.log(err);
                }
              });
            }
            else{
              console.log("No User Exist with such data");
            }
          }else{
            console.log(err);
          }
        });
      }else{
        console.log(err);
      }
    });
  }else{
    console.log("No One Logged In");
  }

});

app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
  }));
app.get('/auth/google/secrets',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    console.log("Succesfully Logged in With Google ");
    res.redirect('/secrets');
  });
app.get('/auth/facebook',
  passport.authenticate('facebook'));
app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    console.log("Succesfully Logged In To FACEBOOK");
    res.redirect('/secrets');
  });
app.post('/delete_secret',function(req,res){
  if(req.isAuthenticated()){
    if(req.user.secretIds.includes(req.body.secretIdToBeDeleted)){
      Secret.deleteOne({_id:req.body.secretIdToBeDeleted},function(err){
        if(!err){
          console.log("Succesfully Deleted");
          res.redirect("/secrets");
        }
        else{
          console.log(err);
        }
      });
    }
  }
});
app.listen(3000, function() {
  console.log(" Server succesfully started ");
});
