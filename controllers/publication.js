const Publication = require("../Models/publication");
const fs = require("fs");
const path = require("path");
const followService = require("../services/followUsersIds");
const pruebaPublication = (req, res) => {
  return res.status(200).send({
    msg: "mensaje prueba pruebaPublication",
  });
};

//Save

const save = (req, res) => {
  //datos del body
  const params = req.body;

  //si no llegan res negativa
  if (!params.text) {
    return res.status(404).send({
      status: "error",
      msg: "no se puede enviar la publicacion",
    });
  }
  //crear y rellenar el obj del modelo

  let newPublication = new Publication(params);
  newPublication.user = req.user.id;
  //guardar el obj en la bd
  newPublication.save().then((publicationStored) => {
    if (!publicationStored) {
      return res.status(404).send({
        status: "error",
        msg: "no se ah guardado la publicacion",
      });
    }
    return res.status(200).send({
      status: "success",
      msg: "puiblicacion guardada",
      publicationStored,
    });
  });
};

const detail = (req, res) => {
  //sacar el id de publicacion de la url
  const publicationId = req.params.id;

  //find con id
  Publication.findById(publicationId).then((publicationStored) => {
    if (!publicationStored) {
      return res.status(400).send({
        status: "error",
        msg: "error al ver detalles",
      });
    }
    return res.status(200).send({
      status: "success",
      msg: "mostrar publicacion",
      publication: publicationStored,
    });
  });
};

const remove = (req, res) => {
  // ID of the publication to remove
  const publicationId = req.params.id;

  // Find and remove the publication using promises
  Publication.findOneAndDelete({ user: req.user.id, _id: publicationId })
    .then((publicationRemove) => {
      if (!publicationRemove) {
        return res.status(404).send({
          status: "error",
          msg: "No se encontró la publicación para eliminar",
        });
      }

      return res.status(200).send({
        status: "success",
        msg: "Publicación eliminada",
        publicationRemove,
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        msg: "Error al eliminar la publicación",
        error: error,
      });
    });
};

//todas las publicaciones de un user
const user = (req, res) => {
  // Get the user ID from the request parameters
  const userId = req.params.id;

  // Set the current page and items per page
  let page = 1;
  const itemsPerPage = 5;

  if (req.params.page) {
    page = parseInt(req.params.page);
  }

  // Calculate the number of documents to skip based on the current page and items per page
  const skip = (page - 1) * itemsPerPage;

  // Find publications
  Publication.find({ user: userId })
    .sort({ created_at: -1 }) 
    .populate("user", "-password -__v -role -email") 
    .skip(skip) 
    .limit(itemsPerPage) 
    .then(async (publications) => {
      const totalPublications = await Publication.countDocuments({
        user: userId,
      }).exec();
      const totalPages = Math.ceil(totalPublications / itemsPerPage);

      if (!publications || publications.length === 0) {
        return res.status(404).send({
          status: "error",
          msg: "El usuario no tiene publicaciones.",
        });
      }

      return res.status(200).send({
        status: "success",
        msg: "Publicaciones de un usuario",
        user: req.user,
        publications,
        pages: totalPages,
      });
    })
    .catch((error) => {
      return res.status(500).send({
        status: "error",
        msg: "Error al obtener las publicaciones del usuario",
        error: error,
      });
    });
};

const upload = (req, res) => {
  const publicationId = req.params.id;
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
  Publication.findOneAndUpdate(
    { user: req.user.id, _id: publicationId },
    { file: req.file.filename },
    { new: true }
  )
    .then((publicationUpdated) => {
      if (!publicationUpdated) {
        return res.status(400).send({
          status: "error",
          msg: "Error en la subida del archivo",
        });
      }

      return res.status(200).send({
        status: "success",
        publication: publicationUpdated,
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

const media = (req, res) => {
  //parametro url
  const file = req.params.file;

  //path real

  const filePath = "./uploads/publications/" + file;

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

//feed

const feed = async (req, res) => {
    // Page
    let page = 1;
  
    if (req.params.page) {
      page = parseInt(req.params.page);
    }
  
    // Elements per page
    const itemsPerPage = 5;
  
    try {
      // Retrieve an array of IDs of users you follow
      const myFollows = await followService.followUserIds(req.user.id);
  
      // Find publications, populate user information,
      const publications = await Publication.find({ user: { $in: myFollows.following_clean } })
        .populate("user", "-password -role -__v -email")
        .sort({ created_at: -1 }) 
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      // Count total publications
      const total = await Publication.countDocuments({ user: { $in: myFollows.following_clean } });
  
      return res.status(200).send({
        status: "success",
        msg: "feed",
        myFollows: myFollows.following_clean,
        publications,
        totalMostrados:total,
        page: Math.ceil(total / itemsPerPage),
        itemsPerPage
      });
    } catch (error) {
      return res.status(404).send({
        status: "error",
        msg: "No se han listado las publicaciones del feed",
      });
    }
  };

module.exports = {
  pruebaPublication,
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
