const Follow = require("../Models/follow");
const followUserIds = async (identityUserId) => {
    try {
      const following = await Follow.find({ user: identityUserId }).select({
        "_id": 0, // Use "_id" instead of "__id"
        "__v": 0,
        "user": 0,
      }).exec();
  
      const followers = await Follow.find({ "followed": identityUserId }).select({
        "user": 1, // Exclude other fields you don't need
        "_id": 0, // You can exclude "_id" here
      }).exec();
  

      let following_clean = []
  
      following.forEach(follow => {
        following_clean.push(follow.followed)
      })
  
      let followers_clean = []
  
      followers.forEach(follow => {
        followers_clean.push(follow.user)
      })
      console.log(following_clean)

  
      return {
        following_clean,
        followers_clean
      };
    } catch (error) {
      console.log(error);
      throw error; // Rethrow the error for handling in the calling function
    }
  }
const followThisUser = async (identityUserId, profileUserId) => {
    try {
        const following = await Follow.findOne({ user: identityUserId, "followed":profileUserId })
        const follower = await Follow.findOne({ "user":profileUserId, "followed": identityUserId })
        return {
            following,
            follower
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
  followUserIds,
  followThisUser,
};
