var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var UserSchema = new mongoose.Schema({
  google: {
    id: String,
  },
  name:String,
  username: {type: String, lowercase: true, unique: true,
    //  required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], 
     index: true},
  email: {type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true},
  image: String,
  // favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  // following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  posts:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],

  post_count:{ type: Number, default: 0 },
  likes:{ type: Number, default: 0 },

  commitments:[
    String
  ],

  influence:{ type: Number, default: 0 },
  popularity:{ type: Number, default: 0 },


  party:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
    },
  
  pack:
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pack',
    },


  location:
   {
    type: { type: String },
    coordinates: []
    },




  //  [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Like',
  //   },
  // ],
  // comments:{ type: Number, default: 0 },
  // [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Comment',
  //   },
  // ],
  // followers: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     ref: 'Follow',
  //   },
  // ],
  // following: [
  //   {
  //     type: Schema.Types.ObjectId,
  //     ref: 'Follow',
  //   },
  // ],
  hash: String,
  salt: String
}, {timestamps: true});

UserSchema.plugin(uniqueValidator, {message: 'is already taken.'});

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.generateJWT = function() {
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, secret);
};

UserSchema.methods.toAuthJSON = function(){
  return {
    username: this.username,
    email: this.email,
    token: this.generateJWT(),
    bio: this.bio,
    image: this.image
  };
};

UserSchema.methods.toProfileJSONFor = function(user){
  return {
    photo: this.image || '',
    username: this.name || this.username,
    influence:this.influence,
    popularity:this.popularity,
    commitment:this.commitments,
    party:this.party || {partyname:"Not Joined",
                          partyimage:""},
    pack:this.pack || {packname:"Not Joined",
    packimage:""}
    

    
    // following: user ? user.isFollowing(this._id) : false
  };
};

UserSchema.methods.feedprofile = function(user){
  return {
    user: this.name || this.username,
    photo: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg'
  
  };
};

UserSchema.methods.favorite = function(id){
  if(this.favorites.indexOf(id) === -1){
    this.favorites.push(id);
  }

  return this.save();
};

UserSchema.methods.unfavorite = function(id){
  this.favorites.remove(id);
  return this.save();
};

UserSchema.methods.isFavorite = function(id){
  return this.favorites.some(function(favoriteId){
    return favoriteId.toString() === id.toString();
  });
};

UserSchema.methods.follow = function(id){
  if(this.following.indexOf(id) === -1){
    this.following.push(id);
  }

  return this.save();
};

UserSchema.methods.unfollow = function(id){
  this.following.remove(id);
  return this.save();
};

UserSchema.methods.isFollowing = function(id){
  return this.following.some(function(followId){
    return followId.toString() === id.toString();
  });
};

mongoose.model('User', UserSchema);
