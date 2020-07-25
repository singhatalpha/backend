var mongoose = require('mongoose');
var User = mongoose.model('User');


/**
 * Post schema that has references to User, Like and Comment schemas
 */
var PostSchema = new mongoose.Schema(
  {
    title: String,
    // image: [{
    //   type: mongoose.Schema.Types.ObjectId, 
    //   ref: 'GridFs'
    // }
    // ],
    image:[String],
    video: String,
    // imagePublicId: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    likes:{ type: Number, default: 0 },
    commentscount:{ type: Number, default: 0 },  
    likedby:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    location:
    {
    type: { type: String },
    coordinates: []
    },

    // likes: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Like',
    //   },
    // ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  {
    timestamps: true,
  }
);





PostSchema.index({ location: "2dsphere" });








PostSchema.methods.toJSONFor = function(user){
  return {
    title: this.title,
    media: this.image,
    video: this.video||"",
    likes:this.likes,
    comments:this.commentscount,
    time: this.createdAt,
    id:this.author._id,
    postid:this._id,
    profile: {
      user: this.author.name || this.author.username,
      photo: this.author.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
      position: this.author.position || ''
    }
  };
};

mongoose.model('Post', PostSchema);
