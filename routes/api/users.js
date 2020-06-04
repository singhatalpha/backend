var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var auth = require('../auth');
// var verifier = require('google-id-token-verifier');
// var crypto = require('crypto');
// const ResetToken = require('../../models/ResetToken')
// const nodemailer = require('nodemailer');
router.get('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    return res.json({user: user.toAuthJSON()});
  }).catch(next);
});

router.put('/user', auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    // only update fields that were actually passed...
    if(typeof req.body.user.username !== 'undefined'){
      user.username = req.body.user.username;
    }
    if(typeof req.body.user.email !== 'undefined'){
      user.email = req.body.user.email;
    }
    if(typeof req.body.user.bio !== 'undefined'){
      user.bio = req.body.user.bio;
    }
    if(typeof req.body.user.image !== 'undefined'){
      user.image = req.body.user.image;
    }
    if(typeof req.body.user.password !== 'undefined'){
      user.setPassword(req.body.user.password);
    }

    return user.save().then(function(){
      return res.json({user: user.toAuthJSON()});
    });
  }).catch(next);
});

router.post('/users/login', function(req, res, next){
  console.log(req.body);
  if(!req.body.email){
    return res.status(422).json({errors: {email: "can't be blank"}});
  }

  if(!req.body.password){
    return res.status(422).json({errors: {password: "can't be blank"}});
  }
  req.body.user = req.body;
  passport.authenticate('local', {session: false}, function(err, user, info){
    if(err){ return next(err); }

    if(user){
      user.token = user.generateJWT();
      return res.json({user: user.toAuthJSON()});
    } else {
      return res.status(422).json(info);
    }
  })(req, res, next);
});



//TODO:fucked up security!
router.post('/users/login/google', function(req, res, next){
  
    process.nextTick(function () {
    User.findOne({
        $or: [
            { 'email': req.body.email }
        ]
    }, function (err, user) {
        if (err) {
            // return (err,false);
            res.status(422).json(err);
        }

        if (user) {
            if (user.google.id == undefined) {
                user.google.id = req.body.id;
                user.save();
            }
            user.token = user.generateJWT();
            console.log(user.token);
            return res.json({user: user.toAuthJSON()});
            // return (null, user);


        } else {
            console.log('Entered else')
            var user = new User();
            user.google.id = req.body.id;
            user.username = req.body.email;
            user.email = req.body.email;

            // newUser.save().then(function(){
            //   return res.json({user: user.toAuthJSON()});
            // }).catch(next);

            user.save(err => {
                if (err) {
                    console.log(err);
                    // throw err;
                    res.status(422).json(err);
                  }
              user.token = user.generateJWT();
              console.log(user.token);
              return res.json({user: user.toAuthJSON()});
            // return (null,user);
            });
        }
      });
    });

  // if(err){ return next(err); }

  // if(user){
  //   user.token = user.generateJWT();
  //   return res.json({user: user.toAuthJSON()});
  // } else {
  //   return res.status(422).json(info);
  // }

});


// router.post('/users/login/google', function(req, res, next){
//   console.log(req.body);
  

//   passport.authenticate('google', {session: false}, function(err, user, info){
//     if(err){ return next(err); }

//     if(user){
      // user.token = user.generateJWT();
      // return res.json({user: user.toAuthJSON()});
//     } else {
//       return res.status(422).json(info);
//     }
//   })(req, res, next);
// });




router.post('/users/register', function(req, res, next){
  var user = new User();
  console.log(req)
  user.username = req.body.username;
  user.email = req.body.email;

  user.password = req.body.password1;
  user.confirmpassword = req.body.password2;
  if(user.password1!==user.password2){
    return res.status(422).json({errors: {password: "mismatch!"}});
  }

  user.setPassword(req.body.password);

  user.save().then(function(){
    return res.json({user: user.toAuthJSON()});
  }).catch(next);

});









//PASSWORD RESET :


// router.post('/reset-password',async function(req, res, next){
//   if (!req.body.email) {
//   return res
//   .status(500)
//   .json({ message: 'Email is required' ,errors: {Email: "is Required!"}});
//   }
 
//   var user = await User.findOne({email:req.body.email})
  
//   if(!user){return res
//     .status(409)
//     .json({ message: 'Email not found!' ,errors: {Email: "not found!"}});
//   }

//   console.log(user.username)
//   // ResetToken.find({ _id: user._id, resettoken: { $ne: resettoken.resettoken } }).remove().exec();
  

//   var resettoken = new ResetToken({ _id: user._id, resettoken: crypto.randomBytes(16).toString('hex') });

//   resettoken.save(function (err) {
//   if (err) { 
//     console.log('Error Occured!')
//     console.log(err)
//     return res.status(500).json({ message: 'Already Sent' ,errors:{Email:' is Already sent, Please try again in 5mins.'}}); 
//   }
  
//   res.status(200).json({ message: 'Reset Password successfully.' });
//   var transporter = nodemailer.createTransport({
//     service: 'Gmail',
//     port: 465,
//     auth: {
//       user: 'user',
//       pass: 'password'
//     }
//   });
//   var mailOptions = {
//   to: user.email,
//   from: 'your email',
//   subject: 'Node.js Password Reset',
//   text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
//   'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
//   'http://localhost:4200/response-reset-password/' + resettoken.resettoken + '\n\n' +
//   'If you did not request this, please ignore this email and your password will remain unchanged.\n'
//   }
//   transporter.sendMail(mailOptions, (err, info) => {
//   })
//   })
   
// });




module.exports = router;
