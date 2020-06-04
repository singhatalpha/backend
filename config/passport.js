var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var GoogleStrategy = require('passport-google-plus-token');
// var GoogleStrategy = require('passport-google-oauth20').Strategy;


passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, function(email, password, done) {
  User.findOne({email: email}).then(function(user){
    if(!user || !user.validPassword(password)){
      return done(null, false, {errors: {'email or password': 'is invalid'}});
    }

    return done(null, user);
  }).catch(done);
}));

passport.use('google',new GoogleStrategy({
  clientID:'405438053464-nkatmniddqoe4sir0iur7k5thfbss6ge.apps.googleusercontent.com',
  clientSecret:'nCQkFmm0UPLmYij0-aWl-QLP',
  callbackURL:'users/login/google'
  
}, function (accessToken,refreshToken,profile,done) {
  console.log('Entered in');
  console.log('profile',profile);
  
  process.nextTick(function () {
    User.findOne({
        $or: [
            { 'google.id': profile.id },
            { 'email': profile.emails[0].value }
        ]
    }, function (err, user) {
        if (err) {
            return done(err,false);
        }

        if (user) {
            if (user.google.id == undefined) {
                user.google.id = profile.id;
                user.save();
            }

            return done(null, user);

        } else {
            console.log('Entered else')
            var user = new User();
            user.google.id = profile.id;
            user.username = profile.emails[0].value;
            // newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
            user.name = profile.name.givenName + ' ' + profile.name.familyName;
            user.email = profile.emails[0].value;

            // newUser.save().then(function(){
            //   return res.json({user: user.toAuthJSON()});
            // }).catch(next);

            user.save(err => {
                if (err) {
                    console.log(err);
                    throw err;
                }
                
                return done(null, user);
            });
        }
    });
});
}));




