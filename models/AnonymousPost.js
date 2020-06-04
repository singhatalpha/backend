var mongoose = require('mongoose');
var User = mongoose.model('User');


/**
 * Post schema that has references to User, Like and Comment schemas
 */
var AnonymousPostSchema = new mongoose.Schema(
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





AnonymousPostSchema.index({ location: "2dsphere" });








AnonymousPostSchema.methods.toJSONFor = function(user){
  return {
    title: this.title,
    media: this.image,
    likes:this.likes,
    comments:this.comments,
    time: this.createdAt,
  };
};

mongoose.model('AnonymousPost', AnonymousPostSchema);