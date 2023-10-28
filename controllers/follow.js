const Follow = require("../Models/follow");
const User = require("../Models/user");
const followService = require("../services/followUsersIds");
const mongoosePagination = require("mongoose-pagination");

const pruebaFollow = (req, res) => {
  return res.status(200).send({
    msg: "mensaje prueba pruebaFollow",
  });
};

//accion seguir

const save = (req, res) => {
  //conseguir usuario x body
  const params = req.body;

  //Sacar id del user identificado

  const identity = req.user;

  //crear obj con modelo follow

  let userToFollow = new Follow({
    user: identity.id,
    followed: params.followed,
  });

  //guardar obj en bd

  userToFollow.save().then((followedStored) => {
    if (!followedStored) {
      return res.status(400).send({
        status: "error",
        msg: "no se ah podido seguir usuario",
      });
    }
    return res.status(200).send({
      status: "success",
      identity: req.user,
      follow: followedStored,
    });
  });
};

//accion dejar de seguir

const unfollow = (req, res) => {
  //recojer id user identificado

  const userId = req.user.id;
  //recibir id al que quiero dejar de seguir
  const followedId = req.params.id;

  //find de coincidencia y hacer remove
  Follow.findOneAndDelete({
    user: userId,
    followed: followedId,
  })
    .then((followdDelete) => {
      if (!followdDelete) {
        return res.status(400).send({
          status: "error",
          msg: "No se encontró un seguidor para eliminar",
        });
      }
      return res.status(200).send({
        status: "success",
        msg: "Unfollow",
        followdDelete,
      });
    })
    .catch((error) => {
      return res.status(400).send({
        status: "error",
        msg: "Error al eliminar seguidor",
        error: error,
      });
    });
};

//accion listado de usuarios se esta siguiendo

const following = (req, res) => {
  // Get the user's ID
  let userId = req.user.id;

  // Check if there's a specific user ID in the request parameters
  if (req.params.id) {
    userId = req.params.id;
  }

  // Check the requested page, default to 1
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  // Define the number of users per page
  const itemsPerPage = 3;

  // Find Follows, paginate using Mongoose, and populate data
  Follow.find({ user: userId })
    .populate("user followed", "-password -role -__v -email")
    .exec() // Execute the query to get a promise
    .then(async (follows) => {
      // Calculate the total count of users you are following
      const totalFollowing = follows.length;

      // Paginate the results
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedFollows = follows.slice(startIndex, endIndex);

      try {
        const followUserIdsResult = await followService.followUserIds(
          req.user.id
        );

        return res.status(200).send({
          status: "success",
          msg: "Lista de usuarios que estoy siguiendo",
          follows: paginatedFollows,
          total: totalFollowing,
          user_following: followUserIdsResult.following_clean,
          user_follow_me: followUserIdsResult.followers_clean,
          page,
        });
      } catch (error) {
        // Handle the error, e.g., send an error response
        return res.status(500).send({
          status: "error",
          msg: "Error al obtener la lista de usuarios que estoy siguiendo",
          error: error.message,
        });
      }
    });
};

//Accion de listado de usuarios que me siguen

const followers = (req, res) => {
    // Get the user's ID
  let userId = req.user.id;

  // Check if there's a specific user ID in the request parameters
  if (req.params.id) {
    userId = req.params.id;
  }

  // Check the requested page, default to 1
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  // Define the number of users per page
  const itemsPerPage = 3;

  // Find Follows, paginate using Mongoose, and populate data
  Follow.find({ followed: userId })
    .populate("user followed", "-password -role -__v -email")
    .exec() // Execute the query to get a promise
    .then(async (follows) => {
      // Calculate the total count of users you are following
      const totalFollowing = follows.length;

      // Paginate the results
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedFollows = follows.slice(startIndex, endIndex);

      try {
        const followUserIdsResult = await followService.followUserIds(
          req.user.id
        );

        return res.status(200).send({
          status: "success",
          msg: "Lista de usuarios que me siguen ",
          follows: paginatedFollows,
          total: totalFollowing,
          user_following: followUserIdsResult.following_clean,
          user_follow_me: followUserIdsResult.followers_clean,
          page,
        });
      } catch (error) {
        // Handle the error, e.g., send an error response
        return res.status(500).send({
          status: "error",
          msg: "Error al obtener la lista de usuarios que estoy siguiendo",
          error: error.message,
        });
      }
    });
};

module.exports = {
  pruebaFollow,
  save,
  unfollow,
  following,
  followers,
};
