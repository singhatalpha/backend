var router = require('express').Router();
var mongoose = require('mongoose');
var Article = mongoose.model('Article');
var Comment = mongoose.model('Comment');
var AnonymousComment = mongoose.model('AnonymousComment');
var Post = mongoose.model('Post');
var AnonymousPost = mongoose.model('AnonymousPost');
var User = mongoose.model('User');
var Commitment = mongoose.model('Commitment');
var auth = require('../auth');
var multer = require('multer');
var crypto = require('crypto');
const GridFsStorage = require("multer-gridfs-storage");
const { post } = require('request');
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
        // const filename = "http://192.168.43.99:3000/api/load/"+token
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



// Preload article objects on routes with ':article'
// router.param('article', function(req, res, next, slug) {
//   Article.findOne({ slug: slug})
//     .populate('author')
//     .then(function (article) {
//       if (!article) { return res.sendStatus(404); }

//       req.article = article;

//       return next();
//     }).catch(next);
// });

// router.param('comment', function(req, res, next, id) {
//   Comment.findById(id).then(function(comment){
//     if(!comment) { return res.sendStatus(404); }

//     req.comment = comment;

//     return next();
//   }).catch(next);
// });

router.get('/', auth.optional, function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  if( typeof req.query.tag !== 'undefined' ){
    query.tagList = {"$in" : [req.query.tag]};
  }

  Promise.all([
    req.query.author ? User.findOne({username: req.query.author}) : null,
    req.query.favorited ? User.findOne({username: req.query.favorited}) : null
  ]).then(function(results){
    var author = results[0];
    var favoriter = results[1];

    if(author){
      query.author = author._id;
    }

    if(favoriter){
      query._id = {$in: favoriter.favorites};
    } else if(req.query.favorited){
      query._id = {$in: []};
    }

    return Promise.all([
      Article.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({createdAt: 'desc'})
        .populate('author')
        .exec(),
      Article.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function(results){
      var articles = results[0];
      var articlesCount = results[1];
      var user = results[2];

      return res.json({
        articles: articles.map(function(article){
          return article.toJSONFor(user);
        }),
        articlesCount: articlesCount
      });
    });
  }).catch(next);
});

router.get('/feed',auth.required, function(req, res, next) {
  

  console.log(req.query);
  var longitude = req.query.longitude;
  var latitude = req.query.latitude;


  // Promise.all([
    //       Post.find()
    //         .sort({ createdAt: 'desc' })
    //         .populate()
    //         .exec(),
    //     ]).then(function(results){
    //       var feeds = results[0];
    //       // var articlesCount = results[1];
    //       console.log(results);
    //       return res.json({
    //         feeds: feeds.map(function(post){
    //           return post.toJSONFor(user);
    //         }),
    //         status:'300'
    //       // return res.json({feeds:feeds,status:'300'})
    //       })
    //     });


  User.findById(req.payload.id).then(function(user){
    if (!user) { 
      return res.sendStatus(401); 
    }

    Promise.all([
      Post.find({
          location: {
          $near: {
          //  $maxDistance: 90*1000,
           $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
           }
          }
        }
      })
        .limit(20)
        .populate('author')
        .exec(),
    ]).then(function(results){
      console.log(results);
      var feeds = results[0];
      // var articlesCount = results[1];
      console.log(results);
      return res.json({
        feeds: feeds.map(function(post){
          return post.toJSONFor(user);
        }),
        status:'300'
      // return res.json({feeds:feeds,status:'300'})
      })
    });
    }).catch(next);
  });



  router.get('/feedgrid',auth.required, function(req, res, next) {
    
    var id = req.query.id;
  
    User.findById(req.payload.id).then(function(user){
      if (!user) { 
        return res.sendStatus(401); 
      }
  
      Promise.all([
        Post.find({author: id})
          .populate()
          .exec(),
      ]).then(function(results){
        var feeds = results[0];
        // var articlesCount = results[1];
        
        return res.json({
          feeds: feeds.map(function(post){
            return post.toJSONFor(user);
          }),
          status:'300'
        // return res.json({feeds:feeds,status:'300'})
        })
      });
      }).catch(next);
    });

    router.get('/myfeedgrid',auth.required, function(req, res, next) {
      console.log(req.query);
    
      User.findById(req.payload.id).then(function(user){
        if (!user) { 
          return res.sendStatus(401); 
        }
        console.log(user);
        Promise.all([
          Post.find({author: user._id})
            .populate()
            .exec(),
        ]).then(function(results){
          var feeds = results[0];
          // var articlesCount = results[1];
          console.log(results);
          return res.json({
            feeds: feeds.map(function(post){
              return post.toJSONFor(user);
            }),
            status:'300'
          // return res.json({feeds:feeds,status:'300'})
          })
        });
        }).catch(next);
      });




  router.get('/anonymousfeed',auth.required, function(req, res, next) {
  

    console.log(req.query);
    var longitude = req.query.longitude;
    var latitude = req.query.latitude;
    User.findById(req.payload.id).then(function(user){
      if (!user) { 
        return res.sendStatus(401); 
      }
  
      Promise.all([
        AnonymousPost.find({
            location: {
            $near: {
            //  $maxDistance: 1000,
             $geometry: {
              type: "Point",
              coordinates: [longitude, latitude]
             }
            }
          }
        })
          .limit(20)
          .populate()
          .exec(),
      ]).then(function(results){
        var feeds = results[0];
        // var articlesCount = results[1];
        console.log(results);
        return res.json({
          feeds: feeds.map(function(AnonymousPost){
            return AnonymousPost.toJSONFor(user);
          }),
          status:'300'
        
        })
      });
      }).catch(next);
    });





router.post('/addpost', upload.any('image'), auth.required,function(req, res, next) {
  
  
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }
    
    var post = new Post(req.body);
    post.image = req.files.map(a => a.filename);
    post.author = user;
    post.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.longitude),parseFloat(req.body.latitude)]
     }
    console.log(post.image);
    console.log(req.files)

    return post.save().then(function(){
      return res.sendStatus(200);
    });
  }).catch(next);
});

router.post('/addanonymouspost', upload.any('image'), auth.required,function(req, res, next) {
  
  
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }
    
    var post = new AnonymousPost(req.body);
    post.image = req.files.map(a => a.filename);
    post.location = {
      type: "Point",
      coordinates: [parseFloat(req.body.longitude),parseFloat(req.body.latitude)]
     }
    
    post.author = user;
    console.log(post.image);
    console.log(req.files)

    return post.save().then(function(){
      return res.sendStatus(200);

    });
  }).catch(next);
});



// return a article
// router.get('/:article',auth.optional, function(req, res, next) {
//   Promise.all([
//     req.payload ? User.findById(req.payload.id) : null,
//     req.article.populate('author').execPopulate()
//   ]).then(function(results){
//     var user = results[0];

//     return res.json({article: req.post.toJSONFor(user)});
//   }).catch(next);
// });

// // update article
// router.put('/:article', auth.required, function(req, res, next) {
//   User.findById(req.payload.id).then(function(user){
//     if(req.article.author._id.toString() === req.payload.id.toString()){
//       if(typeof req.body.article.title !== 'undefined'){
//         req.article.title = req.body.article.title;
//       }

//       if(typeof req.body.article.description !== 'undefined'){
//         req.article.description = req.body.article.description;
//       }

//       if(typeof req.body.article.body !== 'undefined'){
//         req.article.body = req.body.article.body;
//       }

//       if(typeof req.body.article.tagList !== 'undefined'){
//         req.article.tagList = req.body.article.tagList
//       }

//       req.article.save().then(function(article){
//         return res.json({article: article.toJSONFor(user)});
//       }).catch(next);
//     } else {
//       return res.sendStatus(403);
//     }
//   });
// });

// // delete article
// router.delete('/:article', auth.required, function(req, res, next) {
//   User.findById(req.payload.id).then(function(user){
//     if (!user) { return res.sendStatus(401); }

//     if(req.article.author._id.toString() === req.payload.id.toString()){
//       return req.article.remove().then(function(){
//         return res.sendStatus(204);
//       });
//     } else {
//       return res.sendStatus(403);
//     }
//   }).catch(next);
// });

// Favorite an article
router.post('/like', auth.required, function(req, res, next) {
  var articleId = req.body.id;
  var type = req.body.type;
  console.log(type);
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }
    if(type=="post"){
      Post.findOne({ _id: articleId } ,function(err, response) {
        if (err) {
        return res.sendStatus(400);
       } else {
        var exists = response.likedby.some(function (friend) {
          return friend.equals(user.id);
      });
      if(!exists){
        response.likes++;
        response.likedby.push(user);
        User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
          
        });
        response.save();
      }
        return res.sendStatus(200);
       }
      });
  }
  else if (type=="comment"){
    Comment.findOne({ _id: articleId } ,function(err, response) {
      if (err) {
      return res.sendStatus(400);
     } else {
      var exists = response.likedby.some(function (friend) {
        return friend.equals(user.id);
    });
    if(!exists){
      response.likes++;
      response.likedby.push(user);
      User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        
      });
      response.save();
    }
      return res.sendStatus(200);
     }
    });
  }
  else if (type=="anony"){
    AnonymousComment.findOne({ _id: articleId } ,function(err, response) {
      if (err) {
      return res.sendStatus(400);
     } else {
      var exists = response.likedby.some(function (friend) {
        return friend.equals(user.id);
    });
    if(!exists){
      response.likes++;
      response.likedby.push(user);
      User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        
      });
      response.save();
    }
      return res.sendStatus(200);
     }
    });
  }
  else if (type=="commitment"){
    Commitment.findOne({ _id: articleId },function(err, response) {
      if (err) {
      return res.sendStatus(400);
     } else {
      var exists = response.likedby.some(function (friend) {
        return friend.equals(user.id);
    });
    if(!exists){
      response.likes++;
      response.likedby.push(user);
      User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        
      });
      response.save();
    }
      return res.sendStatus(200);
     }
    });
  }
  else {
    AnonymousPost.findOne({ _id: articleId } ,function(err, response) {
      if (err) {
      return res.sendStatus(400);
     } else {
      var exists = response.likedby.some(function (friend) {
        return friend.equals(user.id);
    });
    if(!exists){
      response.likes++;
      response.likedby.push(user);
      User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        
      });
      response.save();
    }
      return res.sendStatus(200);
     }
    });
  }

    // return user.favorite(articleId).then(function(){
    //   return req.article.updateFavoriteCount().then(function(article){
    //     return res.json({article: article.toJSONFor(user)});
    //   });
    // });
  }).catch(next);
});

// Unfavorite an article
router.post('/dislike', auth.required, function(req, res, next) {
  var articleId = req.body.id;
  var type = req.body.type;
  console.log(type);
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    if(type=="post"){
      Post.findOne({ _id: articleId },function(err, response) {
        if (err) {
        return res.sendStatus(400);
       } else {
        var exists = response.likedby.some(function (friend) {
          return friend.equals(user.id);
      });
      if(!exists){
        console.log("entered in if exist")
        response.likes--;
        response.likedby.push(user);
        User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': -1 } },function(err, response) {
        });
        response.save();
      }
        return res.sendStatus(200);
       }
      });
    }
    else if (type=="comment"){
      Comment.findOne({ _id: articleId },function(err, response) {
        if (err) {
        return res.sendStatus(400);
       } else {
        var exists = response.likedby.some(function (friend) {
          return friend.equals(user.id);
      });
      if(!exists){
        console.log("entered in if exist")
        response.likes--;
        response.likedby.push(user);
        User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        });
        response.save();
      }
        return res.sendStatus(200);
       }
      });
    }
    else if (type=="anony"){
      AnonymousComment.findOne({ _id: articleId },function(err, response) {
        if (err) {
        return res.sendStatus(400);
       } else {
        var exists = response.likedby.some(function (friend) {
          return friend.equals(user.id);
      });
      if(!exists){
        console.log("entered in if exist")
        response.likes--;
        response.likedby.push(user);
        User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        });
        response.save();
      }
        return res.sendStatus(200);
       }
      });
    }
    else if (type=="commitment"){
      Commitment.findOne({ _id: articleId },function(err, response) {
        if (err) {
        return res.sendStatus(400);
       } else {
        var exists = response.likedby.some(function (friend) {
          return friend.equals(user.id);
      });
      if(!exists){
        response.likes--;
        response.likedby.push(user);
        User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': 1 } },function(err, response) {
        
        });
        response.save();
      }
        return res.sendStatus(200);
       }
      });
    }
    else{
      AnonymousPost.findOne({ _id: articleId },function(err, response) {
        if (err) {
        return res.sendStatus(400);
       } else {
        var exists = response.likedby.some(function (friend) {
          return friend.equals(user.id);
      });
      if(!exists){
        console.log("entered in if exist")
        response.likes--;
        response.likedby.push(user);
        User.findOneAndUpdate({ _id: response.author }, { $inc: {'influence': -1 } },function(err, response) {
        });
        response.save();
      }
        return res.sendStatus(200);
       }
      });
    }

    // return user.favorite(articleId).then(function(){
    //   return req.article.updateFavoriteCount().then(function(article){
    //     return res.json({article: article.toJSONFor(user)});
    //   });
    // });
  }).catch(next);
});











// return an article's comments
router.get('/comments', auth.optional, function(req, res, next){
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
    console.log(req.query);

    if (req.query.type=="post"){
    Post.findById({ _id : req.query.id }, function(err, foundpost) {
      if(err){
        console.log(err);
      }
      return foundpost.populate({
        path: 'comments',
        populate: {
          path: 'author'
        },
        options: {
          sort: {
            createdAt: 'desc'
          }
        }
      }).execPopulate().then(function(foundpost) {
        return res.json({comments: foundpost.comments.map(function(comment){
          return comment.toJSONFor(user);
        })});
      });

    });
  }
  else{
    AnonymousPost.findById({ _id : req.query.id }, function(err, foundpost) {
      if(err){
        console.log(err);
      }
      return foundpost.populate({
        path: 'comments',
        populate: {
          path: 'author'
        },
        options: {
          sort: {
            createdAt: 'desc'
          }
        }
      }).execPopulate().then(function(foundpost) {
        return res.json({comments: foundpost.comments.map(function(comment){
          return comment.toJSONFor(user);
        })});
      });

    });
  }

    
  }).catch(next);
});

// create a new comment
router.post('/addcomment', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }
    if (req.body.type=="post"){
    Post.findById({ _id : req.body.id }, function(err, foundpost) {
      if(err){
        console.log(err);
      }
      var comment = new Comment();
      comment.body = req.body.comment;
      comment.author = user;
      comment.post = foundpost;

      return comment.save().then(function(){
        comment.post.comments.push(comment);
        comment.post.commentscount++;
        return comment.post.save().then(function(post) {
          res.sendStatus(200);
        });
      });
    });
  }
  else{
    AnonymousPost.findById({ _id : req.body.id }, function(err, foundpost) {
      if(err){
        console.log(err);
      }
      var comment = new AnonymousComment();
      comment.body = req.body.comment;
      comment.author = user;
      comment.post = foundpost;

      return comment.save().then(function(){
        comment.post.comments.push(comment);
        comment.post.commentscount++;
        return comment.post.save().then(function(post) {
          res.sendStatus(200);
        });
      });
    });
  }
  }).catch(next);
});

// router.delete('/:article/comments/:comment', auth.required, function(req, res, next) {
//   if(req.comment.author.toString() === req.payload.id.toString()){
//     req.article.comments.remove(req.comment._id);
//     req.article.save()
//       .then(Comment.find({_id: req.comment._id}).remove().exec())
//       .then(function(){
//         res.sendStatus(204);
//       });
//   } else {
//     res.sendStatus(403);
//   }
// });


















module.exports = router;
