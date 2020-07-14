var mongoose = require('mongoose');
var router = require('express').Router();
var passport = require('passport');
var User = mongoose.model('User');
var Pack = mongoose.model('Pack');
var Party = mongoose.model('Party');
var Notification = mongoose.model('Notification');
var Commitment = mongoose.model('Commitment');
var auth = require('../auth');
var multer = require('multer');
var crypto = require('crypto');
const GridFsStorage = require("multer-gridfs-storage");
const { sort } = require('methods');
const storage = new GridFsStorage({
  url: 'mongodb+srv://test:12qwaszx@cluster0-l90om.mongodb.net/test?retryWrites=true&w=majority',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        var token = buf.toString('hex');
        if (err) {
          return reject(err)
        }
        // const url = file.path;
        const filename = "http://alphanetwork.herokuapp.com/api/load/"+token
        const name = file.originalname
        const fileInfo = {
          // url : url,
          name:name,
          filename: filename,
          bucketName: 'uploads',
        }
        resolve(fileInfo)
      })
    })
  },
});

const upload = multer({ storage });





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

router.patch('/user', upload.any('photo'),auth.required, function(req, res, next){
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }
    
    
    // only update fields that were actually passed...
    if(typeof req.body.username!='undefined' && req.body.username!=''){
      
      if(typeof user.name=='undefined'){
        console.log('No name');
      user['name'] = req.body.username;
      }
      else{
        console.log('Entered else, name exists');
        user.name = req.body.username;
      }
    
    }

    if(req.files.length!=0){
      console.log('Image is there')

      if(typeof user.image=='undefined'){
        console.log('No image defined');
      user['image'] = req.files[0].filename;
      }
      else{
        console.log('Entered else, image exists');
        user.image = req.files[0].filename;
      }
    
    }
    // user.image = req.files.map(a => a.filename);
    

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





router.get('/users/search', auth.required, function(req, res, next) {
  

  console.log(req.query.name);
  // var query = req.query.name;
  var regexp = new RegExp("^"+ req.query.name,"i");
  User.findById(req.payload.id).then(function(user){
    if (!user) { 
      return res.sendStatus(401); 
    }
    Promise.all([
      User.find(
        // $or: [
        //   { name: regexp },
        //   { username: regexp},
        // ]
        {name:regexp}
        )
        .limit(10)
        .populate()
        .exec(),
    ]).then(function(results){
      var feeds = results[0];
      // var articlesCount = results[1];
      console.log(results);
      return res.json({
        // profiles:feeds
        profiles: feeds.map(function(user){
          return user.toProfileJSONFor(user);
        })
      })
    });
    }).catch(next);
  });

  router.get('/users/checkpack', auth.required, function(req, res, next) {
  
    User.findById(req.payload.id).then(function(user){
      if (!user) { 
        return res.sendStatus(401); 
      }
      if(typeof user.pack=='undefined'){
        console.log("Send 400")
        return res.sendStatus(400);
      }
      else{
        return res.sendStatus(200);
      }

      }).catch(next);
    });
    router.get('/users/checkparty', auth.required, function(req, res, next) {
  
      User.findById(req.payload.id).then(function(user){
        if (!user) { 
          return res.sendStatus(401); 
        }
        if(typeof user.party=='undefined'){
          return res.sendStatus(400);
        }
        else{
          return res.sendStatus(200);
        }
  
        }).catch(next);
      });

    router.post('/users/createpack', upload.any('photo'),auth.required, function(req, res, next) {
  
      User.findById(req.payload.id).then(function(user){
        if (!user) { 
          return res.sendStatus(401);
        }
        var pack = new Pack();
        pack.name = req.body.name;
        pack.dp = req.files[0].filename;
        pack.alpha = user;
        // var member = {
        //   name:user.name||user.username,
        //   photo:user.image,
        //   user:user,
        //   designation:"Alpha"
        // }
        pack.members.push(user);
        console.log(pack);
        return pack.save().then(function(){
          user.pack = pack;
          user.packDesignation = "Alpha";
          return user.save().then(function() {
            res.sendStatus(200);
          });
        });

        }).catch(next);
      });

      router.post('/users/createparty', upload.any('photo'),auth.required, function(req, res, next) {
  
        User.findById(req.payload.id).then(function(user){
          if (!user) { 
            return res.sendStatus(401);
          }
          var party = new Party();
          party.name = req.body.name;
          party.dp = req.files[0].filename;
          party.alpha = user;
          // var member = {
          //   name:user.name||user.username,
          //   photo:user.image,
          //   user:user,
          //   designation:"President"
          // }
          party.members.push(user);
          party.membercount++;
          console.log(party);
          return party.save().then(function(){
            user.party = party;
            user.partyDesignation = "President";
            return user.save().then(function() {
              res.sendStatus(200);
            });
          });
  
          }).catch(next);
        });

      router.get('/users/getpack', auth.required, function(req, res, next) {
  
        User.findById(req.payload.id).then(function(user){
          if (!user) { 
            return res.sendStatus(401); 
          }
          
            return user.populate({
              path: 'pack',
              populate: {
                path: 'members',
              },
              
              // options: {
              //   sort: {
              //     influence: 'desc'
              //   }
              // }
            }).execPopulate().then(function(user) {
                console.log(user.pack.members[0]);
                res.json({
                  name:user.pack.name,
                  dp:user.pack.dp,
                  // alpha:user.pack.alpha.name || user.pack.alpha.username,
                  alpha:user.pack.alpha,
                  influence:user.pack.influence,
                  members:user.pack.members,
                  
                  pack_id:user.pack.id,
                  membercount:user.pack.members.length,
                  user_id:user.id
                });
              });
          
    
          }).catch(next);
        });

        router.get('/users/getparty', auth.required, function(req, res, next) {
  
          User.findById(req.payload.id).then(function(user){
            if (!user) { 
              return res.sendStatus(401); 
            }
            
              return user.populate({
                path: 'party',
                populate: {
                  path: 'members',
                  
                  // path: 'alpha'
                },
                
                // options: {
                //   sort: {
                //     influence: 'desc'
                //   }
                // }
              }).execPopulate().then(function(user) {
                  console.log(user.party.members[0]);
                  res.json({
                    name:user.party.name,
                    dp:user.party.dp,
                    // alpha:user.party.alpha.name || user.party.alpha.username,
                    alpha:user.party.alpha,
                    influence:user.party.influence,
                    members:user.party.members,
                    pack_id:user.party.id,
                    membercount:user.party.membercount,
                    user_id:user.id
                  });
                });
            
      
            }).catch(next);
          });

        router.post('/users/send', auth.required, function(req, res, next) {
  
          User.findById(req.body.user_id).then(function(user){
            if (!user) { 
              return res.sendStatus(401);
            }
            console.log(req.body);
            var type = req.body.type;
            var notification = new Notification();
            notification.type = type;
            notification.user = user;
            notification.sender = req.payload.id;
            if(type=="pack"){
              notification.pack = mongoose.Types.ObjectId(req.body.id);
            }
            else{
                notification.party = mongoose.Types.ObjectId(req.body.id);
            }
            
            
            return notification.save().then(function(){
              user.notifications.push(notification);
              return user.save().then(function() {
                res.sendStatus(200);
              });
            });
    
            }).catch(next);
          });

          router.post('/users/accept', auth.required, function(req, res, next) {
            console.log(req.body);
            User.findById(req.payload.id).then(function(user){
              if (!user) { 
                return res.sendStatus(401);
              }
              if(req.body.type=="pack"){
              if(typeof user.pack!='undefined'){
                res.sendStatus(400);
              }
              else{
                
                Pack.findById(req.body.p_id).then(function(pack){
                  if(pack.members.length>=12){
                    return res.sendStatus(300);
                  }
                  // var member = {
                  //   name:user.name||user.username,
                  //   photo:user.image,
                  //   user:user
                  // }
                  // console.log(member);
                  user.pack = mongoose.Types.ObjectId(req.body.p_id);
                  user.packDesignation = "Member";
                  user.notifications.pull(req.body.id);
                  return user.save().then(function(){
                    pack.members.push(user);
                    return pack.save().then(function(pack) {
                      res.sendStatus(200);
                    });
                  });
                });
                
              }
            }
            else{
              if(typeof user.party!='undefined'){
                res.sendStatus(400);
              }
              else{
                
                Party.findById(req.body.p_id).then(function(party){
                  // var member = {
                  //   name:user.name||user.username,
                  //   photo:user.image,
                  //   user:user
                  // }
                  // console.log(member);
                  user.party = mongoose.Types.ObjectId(req.body.p_id);
                  user.partyDesignation = "Member";
                  user.notifications.pull(req.body.id);
                  return user.save().then(function(){
                    party.members.push(user);
                    party.membercount++;
                    return party.save().then(function(party) {
                      res.sendStatus(200);
                    });
                  });
                });
                
              }
            }
              
              
              // return notification.save().then(function(){
              //   user.notifications.push(notification);
              //   return user.save().then(function() {
              //     res.sendStatus(200);
              //   });
              // });
      
              }).catch(next);
            });

          router.get('/users/getnotification', auth.required, function(req, res, next) {
  
            User.findById(req.payload.id).then(function(user){
              if (!user) { 
                return res.sendStatus(401); 
              }
              
                return user.populate(
                  {
                    path: 'notifications',
                    populate:  [
                      { path: 'pack' ,options: { retainNullValues: false }},
                      { path: 'party', options: { retainNullValues: false }}
                    ]
                    
                    
                  })
                  .execPopulate().then(function(user) {
                    
                  return res.json({notifications: user.notifications.map(function(notification){
                    console.log(notification)
                    if(notification.type=="pack"){
                      
                    return notification.toJSONForPack(notification);
                     
                  
                  }
                    else{
                      return notification.toJSONForParty(notification);
                    }
                  })

                    });
                  });
              
        
              }).catch(next);
            });

            router.post('/users/remove', auth.required, function(req, res, next) {
              console.log(req.body);
              User.findById(req.body.id).then(function(user){
                if (!user) { 
                  return res.sendStatus(401);
                }
                
                var type = req.body.type;
                
                if(type=="pack"){
                  console.log(user.pack)
                  Pack.findById(user.pack).then(function(pack){

                    if(!pack){ return res.sendStatus(200); }
                    
                    user.pack = undefined;
                    user.packDesignation = undefined;
                    return user.save().then(function(){
                      pack.members.pull(user);
                      return pack.save().then(function(pack) {
                        res.sendStatus(200);
                      });
                    });
                  });
                  
                }
                else{
                  Party.findById(user.party).then(function(party){
                    if(!party){ return res.sendStatus(200); }
                    user.party = undefined;
                    user.partyDesignation = undefined;
                    return user.save().then(function(){
                      party.members.pull(user);
                      party.membercount--;
                      return party.save().then(function(party) {
                        res.sendStatus(200);
                      });
                    });
                  });
                    
                }
                
                }).catch(next);
              });

              router.post('/users/promote', auth.required, function(req, res, next) {
                console.log(req.body);
                User.findById(req.body.id).then(function(user){
                  if (!user) { 
                    return res.sendStatus(401);
                  }
                  
                  var type = req.body.type;
                  
                  if(type=="pack"){
                    
                      if(typeof user.pack == "undefined"){
                        return res.sendStatus(401);
                      }
                      if(user.packDesignation=="Member"){
                        user.packDesignation = "Beta"
                      }
                      else{
                        return res.sendStatus(401);
                      }
                      
                      return user.save().then(function(){
                        return res.sendStatus(200);
                        
                      });
                   
                    
                  }
                  else{
                    if(typeof user.party == "undefined"){
                      return res.sendStatus(401);
                    }
                    if(user.partyDesignation=="Member"){
                      user.partyDesignation = "Vice-President"
                    }
                    else{
                      return res.sendStatus(401);
                    }
                    
                    return user.save().then(function(){
                      return res.sendStatus(200);
                      
                    });
                      
                  }
                  
                  }).catch(next);
                });

                router.post('/users/demote', auth.required, function(req, res, next) {
                  console.log(req.body);
                  User.findById(req.body.id).then(function(user){
                    if (!user) { 
                      return res.sendStatus(401);
                    }
                    
                    var type = req.body.type;
                    
                    if(type=="pack"){
                    
                      if(typeof user.pack == "undefined"){
                        return res.sendStatus(401);
                      }
                      if(user.packDesignation=="Beta"){
                        user.packDesignation = "Member"
                      }
                      else{
                        return res.sendStatus(401);
                      }
                      
                      return user.save().then(function(){
                        return res.sendStatus(200);
                        
                      });
                   
                    
                  }
                  else{
                    if(typeof user.party == "undefined"){
                      return res.sendStatus(401);
                    }
                    if(user.partyDesignation=="Vice-President"){
                      user.partyDesignation = "Member"
                    }
                    else{
                      return res.sendStatus(401);
                    }
                    
                    return user.save().then(function(){
                      return res.sendStatus(200);
                      
                    });
                      
                  }
                    
                    }).catch(next);
                  });

















            router.get('/users/getalpharanking',  function(req, res, next) {
  
              Promise.all([
                User.find()
                  .limit(20)
                  .populate()
                  .sort({ 'influence': 'desc' })
                  .exec(),
              ]).then(function(results){
                var feeds = results[0];
                // var articlesCount = results[1];
                console.log(results);
                return res.json({
                  // profiles:feeds
                  profiles: feeds.map(function(user){
                    return user.toProfileJSONFor(user);
                  })
                })
              });
              });

              router.get('/users/getpackranking', function(req, res, next) {
  
                Promise.all([
                  Pack.find()
                    .limit(20)
                    .populate()
                    .sort({ 'influence': 'desc' })
                    .exec(),
                ]).then(function(results){
                  var feeds = results[0];
                  // var articlesCount = results[1];
                  console.log(results);
                  return res.json({
                    // profiles:feeds
                    packfeed: feeds.map(function(user){
                      return {name:user.name,
                        dp:user.dp,
                        influence:user.influence}
                    })
                  })
                });
                });






                router.get('/users/getcommitments', auth.required, function(req, res, next) {
  
                  User.findById(req.payload.id).then(function(user){
                    if (!user) { 
                      return res.sendStatus(401); 
                    }
                    
                      return user.populate(
                        {
                          path: 'commitments'
                          
                        })
                        .execPopulate().then(function(user) {
                          
                        return res.json({commitments: user.commitments.map(function(commitment){
                          console.log(commitment)
                          
                          return commitment.toJSONFor(commitment);
                       
                        })
      
                          });
                        });
                      }).catch(next);
                    });
                    router.get('/users/viewcommitments', auth.required, function(req, res, next) {
  
                      User.findById(req.query.id).then(function(user){
                        if (!user) { 
                          return res.sendStatus(401); 
                        }
                        
                          return user.populate(
                            {
                              path: 'commitments'
                              
                            })
                            .execPopulate().then(function(user) {
                              
                            return res.json({commitments: user.commitments.map(function(commitment){
                              console.log(commitment)
                              
                              return commitment.toJSONFor(commitment);
                           
                            })
          
                              });
                            });
                          }).catch(next);
                        });

                    router.post('/users/addcommitment', auth.required, function(req, res, next) {
                      User.findById(req.payload.id).then(function(user){
                        if(!user){ return res.sendStatus(401); }
                        
                      
                          var commitment = new Commitment();
                          commitment.body = req.body.commitment;
                          commitment.author = user;
                          
                          return commitment.save().then(function(){
                            user.commitments.push(commitment);
                            
                            return user.save().then(function(user) {
                              res.sendStatus(200);
                            });
                          
                        });
                      
                      
                      }).catch(next);
                    });



module.exports = router;
