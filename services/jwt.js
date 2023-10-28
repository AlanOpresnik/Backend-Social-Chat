const jwt = require("jwt-simple");
const moment = require("moment");

//clave 

const secret = "PASSWORD_SECRET_SOCIAL_CHAT_TOKEN45_123";

const createToken = (user) => {
    const payload = {
        id:user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        iat: moment().unix(),
        exp: moment().add(30, "days").unix(),
    };

    //Devolver el jwt codificado
    return jwt.encode(payload, secret);
}

module.exports = {
    secret,
    createToken
}