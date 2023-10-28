const User = require("../Models/user");
const bcrypt = require("bcrypt");
const jwt = require("../services/jwt");
const fs = require("fs");
const path = require("path");
const Follow = require("../Models/follow")
const mongoosePagination = require("mongoose-pagination");
const followService = require("../services/followUsersIds");

const pruebaUser = (req, res) => {
  return res.status(200).send({
    msg: "mensaje prueba user",
    usuario: req.user,
  });
};

//register

const register = (req, res) => {
  //datos peticion
  const params = req.body;

  console.log(params);

  if (!params.name || !params.email || !params.password || !params.nick) {
    return res.status(400).send({
      msg: "error al crear usuario",
      status: "error",
    });
  }

  //duplicados

  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  }).then(async (users) => {
    if (!users) {
      return res.status(500).json({
        status: "error",
        msg: "Error , no puede registrarse",
      });
    }
    if (users && users.length >= 1) {
      return res.status(500).send({
        status: "error",
        msg: "usuario ya esta registrado",
      });
    }
    //cifrar password

    let pwd = await bcrypt.hash(params.password, 10);
    params.password = pwd;
    const user_to_save = new User(params);
    //guardar user bd
    try {
      const userStored = await user_to_save.save();
      if (userStored) {
        res.status(200).send({
          status: "success",
          msg: "usuario registrado correctamente",
          user: userStored,
        });
      } else {
        res.status(500).send({
          status: "error",
          msg: "error al guardar el usuario en la bd",
        });
      }
    } catch (err) {
      res.status(500).send({
        status: "error",
        msg: "error al guardar el usuario en la bd",
      });
    }
  });
};
const login = (req, res) => {
  // RECOGER PARÁMETROS
  const params = req.body;
  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      msg: "Faltan datos por enviar",
    });
  }

  // BUSCAR SI EXISTE EN LA BD
  User.findOne({ email: params.email })
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          status: "error",
          msg: "No existe usuario",
        });
      }

      // COMPROBAR CONTRASEÑA
      const passwordMatch = bcrypt.compareSync(params.password, user.password);

      if (!passwordMatch) {
        return res.status(400).send({
          status: "error",
          msg: "Contraseña incorrecta",
        });
      }

      // DEVOLVER TOKEN Y DATOS DEL USUARIO
      const token = jwt.createToken(user);

      return res.status(200).send({
        status: "success",
        msg: "Logeado con éxito",
        user: {
          id: user.id,
          nick: user.nick,
          name: user.name,
          email: user.email,
        },
        token,
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        msg: "Error en el servidor",
      });
    });
};

const profile = (req, res) => {
  //recibir id user
  const id = req.params.id;

  //consulta datos user
  User.findById(id)
    .select({ password: 0 })
    .then(async (userProfile) => {
      if (!userProfile) {
        return res.status(404).send({
          status: "error",
          msg: "el usuario no existe",
        });
      }
      //resultado

      //seguimiento

      const followInfo = await followService.followThisUser(req.user.id, id);

      return res.status(200).send({
        status: "succes",
        user: userProfile,
        following: followInfo.following,
        follower: followInfo.follower,
      });
    });
};

const list = (request, response) => {
  // Check current page
  let page = 1;
  if (request.params.page) {
    page = parseInt(request.params.page);
  }

  // Query mongoose pagination
  let itemsPerPage = 5;

  User.find()
    .sort("_id")
    .select("-password -email -role -__v")
    .paginate(page, itemsPerPage)
    .then(async (users, total) => {
      // Get total users
      const totalUsers = await User.countDocuments({}).exec();
      if (!users || users.length === 0) {
        return response.status(404).send({
          status: "Error",
          message: "No users avaliable...",
          error: error,
        });
      }

      // Return response

      const followUserIdsResult = await followService.followUserIds(
        request.user.id
      );
      return response.status(200).send({
        status: "Success",
        users,
        page,
        itemsPerPage,
        total: totalUsers,
        pages: Math.ceil(totalUsers / itemsPerPage),
        user_following: followUserIdsResult.following_clean,
        user_follow_me: followUserIdsResult.followers_clean,
      });
    })
    .catch((error) => {
      return response.status(500).send({
        status: "Error",
        error: error,
        message: "Query error...",
      });
    });
};

const update = async (req, res) => {
  // Información del usuario a actualizar
  let userIdentity = req.user;
  let userToUpdate = req.body;

  // Campos innecesarios
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;

  try {
    // Comprobar si el usuario existe
    const users = await User.find({
      $or: [
        { email: userToUpdate.email.toLowerCase() },
        { nick: userToUpdate.nick.toLowerCase() },
      ],
    });

    if (!users) {
      return res.status(500).json({
        status: "error",
        msg: "Error, no se puede registrar",
      });
    }

    let userIsset = false;
    users.forEach((user) => {
      if (user && user._id != userIdentity.id) userIsset = true;
    });

    if (userIsset) {
      return res.status(500).send({
        status: "error",
        msg: "Usuario ya está registrado",
      });
    }

    // Cifrar contraseña si se proporciona una nueva contraseña
    if (userToUpdate.password) {
      let pwd = await bcrypt.hash(userToUpdate.password, 10);
      userToUpdate.password = pwd;
    }else{
      delete userToUpdate.password;
    }

    // Buscar y actualizar
    const userUpdated = await User.findByIdAndUpdate(
      userIdentity.id,
      userToUpdate,
      { new: true }
    );

    // Respuesta
    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        msg: "Error al actualizar el usuario",
      });
    }

    return res.status(200).send({
      status: "Success",
      msg: "Actualizando usuario",
      user: userUpdated,
    });
  } catch (error) {
    return res.status(404).send({
      status: "error",
      msg: "Error al actualizar",
    });
  }
};

const upload = (req, res) => {
  // Recojer imagen y comprobar
  if (!req.file) {
    return res.status(404).send({
      status: "error",
      msg: "No llega archivo",
    });
  }

  // Nombre del archivo
  let img = req.file.originalname;

  // Extensión
  let imgSplit = img.split(".");
  const extension = imgSplit[1];

  // ¿Extensión correcta?
  if (
    extension != "png" &&
    extension != "jpg" &&
    extension != "jpeg" &&
    extension != "gif"
  ) {
    // Borrar archivo
    const filePath = req.file.path;
    const fileDeleted = fs.unlinkSync(filePath);

    // Respuesta negativa
    return res.status(400).send({
      status: "error",
      msg: "El formato del archivo no es válido",
    });
  }

  // Si la extensión es correcta, guardarla
  User.findOneAndUpdate(
    { _id: req.user.id },
    { avatar: req.file.filename },
    { new: true }
  )
    .then((userUpdated) => {
      if (!userUpdated) {
        return res.status(400).send({
          status: "error",
          msg: "Error en la subida del archivo",
        });
      }

      return res.status(200).send({
        status: "success",
        user: userUpdated,
        file: req.file,
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        msg: "Error en el servidor",
      });
    });
};

const avatar = (req, res) => {
  //parametro url
  const file = req.params.file;

  //path real

  const filePath = "./uploads/avatars/" + file;

  //archivo existe?
  fs.stat(filePath, (err, exist) => {
    if (!exist) {
      return res.status(404).send({
        status: "error",
        msg: "el archivo al que intentas acceder no existe",
      });
    }
    //devolver file
    return res.sendFile(path.resolve(filePath));
  });
};

const counter = async (req, res) => {
let userId = req.user.id;
if(req.params.id){
  userId = req.params.id;
}

try {
    const following = await Follow.count({"user": userId});
    const followed = await Follow.count({"followed": userId});
    const publications = await Follow.count({"user": userId});

    return res.status(200).send({
      status:"success",
      userId,
      following: following,
      followed:followed,
      publications:publications
    })
} catch (error) {
    return res.status(404).send({
      status:"error",
      msg:"error en los contadores",
      error
    })
}
}
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counter,
};
