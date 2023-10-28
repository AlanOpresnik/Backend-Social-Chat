const jwt = require("jwt-simple");
const moment = require("moment");

//clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//authentication

const auth = (req, res, next) => {
  //comprobar si llega

  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      msg: "la peticion no tiene la cabezera de authentication",
    });
  }
  //limpiar token
  let token = req.headers.authorization.replace(/['"]+/g, "");

  //decoded token

  try {
    const payload = jwt.decode(token, secret);

    //comrpobar expiracion del token

    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        msg: "token expirado",
        error,
      });
    }
    //agregar datos de usuario
    req.user = payload;
  } catch (error) {
    return res.status(404).send({
      status: "error",
      msg: "token invalido",
      error,
    });
  }

  //pasar ejecucion
  next();
};

module.exports = {
  auth,
};
