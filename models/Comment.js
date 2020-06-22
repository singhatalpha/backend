var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  likes:{ type: Number, default: 0 },
}, {timestamps: true});

// Requires population of author
CommentSchema.methods.toJSONFor = function(user){
  return {
    id: this._id,
    comment: this.body,
    likes:this.likes,
    commented_date: this.createdAt,
    profile: this.author.feedprofile(user)
  };
};

mongoose.model('Comment', CommentSchema);
