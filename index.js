const {connection} = require("./database/conection")
const express = require("express");
const cors = require("cors");

//Aviso 
console.log("conexion establecida")

//conectar bd
connection()

//Servidor node
const app = express();
const port = 3900;

//cors
app.use(cors());

//datos a obj
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const USER_ROUTES = require("./Routes/user")
const PUBLICATION_ROUTES = require("./Routes/publication")
const FOLLOW_ROUTES = require("./Routes/follow")

app.use("/api/user",USER_ROUTES)
app.use("/api/publication",PUBLICATION_ROUTES)
app.use("/api/follow",FOLLOW_ROUTES)

app.listen(port, () =>{
    console.log("listening on port " + port)
})