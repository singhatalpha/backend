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
    // imagePublicId: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    likes:{ type: Number, default: 0 },
    comments:{ type: Number, default: 0 },  

    location:
    {
    type: { type: String },
    coordinates: []
    }
    // likes: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Like',
    //   },
    // ],
    // comments: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Comment',
    //   },
    // ],
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
    likes:this.likes,
    comments:this.comments,
    time: this.createdAt,
    id:this.author._id,
    profile: {
      user: this.author.name || this.author.username,
      photo: this.author.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
    }
  };
};

mongoose.model('Post', PostSchema);