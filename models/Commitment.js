var mongoose = require('mongoose');
var User = mongoose.model('User');



var CommitmentSchema = new mongoose.Schema(
  {
    body: String,
    likes:{type:Number,default:0},
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likedby:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  {
    timestamps: true,
  }
);

CommitmentSchema.methods.toJSONFor = function(commitment){
  return {
    id:this.id,
    commitment:this.body,
    likes:this.likes,
    date:this.createdAt
};
};

mongoose.model('Commitment', CommitmentSchema);