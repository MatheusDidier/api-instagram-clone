var express = require("express");
var bodyParser = require("body-parser");
var MongoClient = require("mongodb").MongoClient;
var multiparty = require("connect-multiparty");
var fs = require("fs");

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

var port = 8080;

app.listen(port, function () {
    console.log("Servidor está escutando na porta ", port);
});

app.get("/", function (req, res) {
    res.send({ msg: "Olá Postman" });
})

app.post("/api", function (req, res) {


    var dadosBody = req.body;


    if (req.files.arquivo) {
        var path_origem = req.files.arquivo.path;
        var path_destino = "./uploads/" + req.files.arquivo.originalFilename;

        fs.rename(path_origem, path_destino, function (err) {
            if (err) {
                res.status(500).json({ error: err });
            }
            return;
        });

        var dados = {
            titulo: dadosBody.titulo,
            url_imagem: req.files.arquivo.originalFilename
        }
    }
    else {
        var dados = { titulo: dadosBody.titulo };
    }

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {
        if (!err) {
            console.log("Conexão com o banco: SUCESSO");
        }
        else {
            console.log("Não foi possivel a conexão com o banco: ", err);
        }
        var collection = db.collection("postagens");
        collection.insert(dados, function (erro, result) {

            if (erro) {
                res.json(erro);
            }
            else {

                res.json(result);
            }
            db.close();
        })

    })



});

app.get("/uploads/:url", function (req, res) {
    var img = req.params.url;

    fs.readFile("./uploads/" + img, function (err, result) {
        console.log("OI");
        if (err) {
            console.log("TEVE ERRO -> ", err);
        }

        res.writeHead(200, { "content-type": "image/jpg" });
        res.end(result)
    })


})

app.get("/api/:id", function (req, res) {
    var parametro = req.params;

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {
        if (!err) {
            console.log("Conexão com o banco: SUCESSO");
        }
        var mongodb = require("mongodb");
        var collection = db.collection("postagens");
        collection.find({ _id: new mongodb.ObjectID(parametro.id) }).toArray(function (erro, result) {
            if (erro) {
                res.json(erro);
            }
            else {
                res.json(result);
            }
            db.close();
        })
    })
})
app.get("/api", function (req, res) {


    var parametro = req.params;

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {
        if (!err) {
            console.log("Conexão com o banco: SUCESSO");
        }
        var mongodb = require("mongodb");
        var collection = db.collection("postagens");
        collection.find().toArray(function (erro, result) {
            if (erro) {
                res.json(erro);
            }
            else {
                res.json(result);
            }
            db.close();
        })
    })
})
app.put("/api/:id", function (req, res) {
    var parametro = req.params;
    var comentario = req.body.comentario;

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {
        if (!err) {
            console.log("Conexão com o banco: SUCESSO");
        }
        var mongodb = require("mongodb");
        var collection = db.collection("postagens");

        collection.update(
            { _id: new mongodb.ObjectID(parametro.id) }
            , {
                $push:
                    {
                        comentarios:
                            { id_comentario: new mongodb.ObjectID(), comentario: comentario }
                    }
            },
            { multi: false },
            function (erro, result) {
                if (erro) {
                    res.json(erro);
                }
                else {
                    res.json(result);
                }
                db.close();
            })
    })
})
app.delete("/api/:id", function (req, res) {
    var parametro = req.params;

    MongoClient.connect("mongodb://localhost:27017/instagram", function (err, db) {
        if (!err) {
            console.log("Conexão com o banco: SUCESSO");
        }
        var mongodb = require("mongodb");
        var collection = db.collection("postagens");

        collection.update({ }, {$pull: {comentarios: {id_comentario: new mongodb.ObjectID(parametro.id)}} }, {multi: true},function (erro, result) {
            if (erro) {
                res.json(erro);
            }
            else {
                res.status(200).json(result);
            }
            db.close();
        })
    })
})