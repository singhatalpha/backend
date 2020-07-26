var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var secret = "alphaapp";

var UserSchema = new mongoose.Schema({
  google: {
    id: String,
  },
  name:String,
  
  
  position:String,
  confirmed: {type:Boolean, default:false},
  profession: String,
  
  
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

  commitments:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commitment',
  },
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
    packDesignation:String,
    partyDesignation:String,


  location:
   {
    type: { type: String },
    coordinates: []
    },
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
      },
    ],



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
    user_id:this.id,
    photo: this.image || '',
    username: this.name || this.username,
    position:this.position || '',
    influence:this.influence,
    popularity:this.popularity,
    commitment:(this.commitments[0] && this.commitments[0].body ) || "None",
    party:{partyname:(this.party && this.party.name ) || "Not Joined",
    partyimage : (this.party && this.party.dp )  ||  ""},
    pack:{packname:(this.pack && this.pack.name ) || "Not Joined",
    packimage : (this.pack && this.pack.dp )  ||  ""},
    
    // following: user ? user.isFollowing(this._id) : false
  };
};
// UserSchema.methods.toPackJSONFor = function(user){
//   return {
//     name:user.name,
//     dp:user.dp,
//     influence:user.influence
    
//     // following: user ? user.isFollowing(this._id) : false
//   };
// };

UserSchema.methods.feedprofile = function(user){
  return {
    user: this.name || this.username,
    photo: this.image || ''
  
  };
};
UserSchema.methods.searchprofile = function(user){
  return {
    user: this.name || this.username,
    photo: this.image || '',
    influence:this.influence
  
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
