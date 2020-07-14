var mongoose = require('mongoose');
var User = mongoose.model('User');


/**
 * Post schema that has references to User, Like and Comment schemas
 */
var PostSchema = new mongoose.Schema(
  {
    name: String,
    dp:String,
    members:[
      {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    ],

    influence:{ type: Number, default: 0 },
    membercount:{ type: Number, default: 0 },
    alpha: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  {
    timestamps: true,
  }
);

PostSchema.methods.toJSONFor = function(user){
  return {
    title: this.title,
    media: this.image,
    likes:this.likes,
    comments:this.comments,
    time: this.createdAt,
    id:this.author,
    profile: {
      user: user.name || user.username,
      photo: user.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
    }
  };
};

mongoose.model('Party', PostSchema);