var mongoose = require('mongoose');
var User = mongoose.model('User');


/**
 * Post schema that has references to User, Like and Comment schemas
 */
var NotificationSchema = new mongoose.Schema(
  {
   type: String,
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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
   
    
  },
  {
    timestamps: true,
  }
);

NotificationSchema.methods.toJSONForPack = function(notification){
  return {
    
    photo:notification.pack.dp,
    username:notification.pack.name,
    influence:notification.pack.influence,
    type:notification.type,
    id:notification.id,
    p_id:notification.pack.id

    // username:notification.type.name




    // title: this.title,
    // media: this.image,
    // likes:this.likes,
    // comments:this.comments,
    // time: this.createdAt,
    // id:this.author,
    // profile: {
    //   user: user.name || user.username,
    //   photo: user.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
    // }
  };
};
NotificationSchema.methods.toJSONForParty = function(notification){
    return {
      
    photo:notification.party.dp,
    username:notification.party.name,
    influence:notification.party.influence,
    type:notification.type,
    id:notification.id,
    p_id:notification.party.id
  
      // username:notification.type.name
  
  
  
  
      // title: this.title,
      // media: this.image,
      // likes:this.likes,
      // comments:this.comments,
      // time: this.createdAt,
      // id:this.author,
      // profile: {
      //   user: user.name || user.username,
      //   photo: user.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
      // }
    };
  };

mongoose.model('Notification', NotificationSchema);