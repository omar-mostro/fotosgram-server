"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_model_1 = require("../models/usuario.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const token_1 = __importDefault(require("../classes/token"));
const autenticacion_1 = require("../middlewares/autenticacion");
const userRoutes = express_1.Router();
//Login
userRoutes.post('/login', (request, response) => {
    const body = request.body;
    usuario_model_1.Usuario.findOne({
        email: body.email
    }, (err, userDB) => {
        if (err)
            throw err;
        if (!userDB) {
            return response.json({
                ok: false,
                mensaje: 'Usuario/contraseña no son correctos'
            });
        }
        if (userDB.compararPassword(body.password)) {
            const tokenUser = token_1.default.getJwToken({
                _id: userDB._id,
                nombre: userDB.nombre,
                email: userDB.email,
                avatar: userDB.avatar,
            });
            return response.json({
                ok: true,
                token: tokenUser
            });
        }
        else {
            return response.json({
                ok: false,
                mensaje: 'Usuario o conraseña incorrecta ***'
            });
        }
    });
});
userRoutes.post('/create', (request, response) => {
    const user = {
        nombre: request.body.nombre,
        email: request.body.email,
        password: bcrypt_1.default.hashSync(request.body.password, 10),
        avatar: request.body.avatar,
    };
    usuario_model_1.Usuario.create(user).then(userDB => {
        const tokenUser = token_1.default.getJwToken({
            _id: userDB._id,
            nombre: userDB.nombre,
            email: userDB.email,
            avatar: userDB.avatar,
        });
        response.json({
            ok: true,
            token: tokenUser
        });
    })
        .catch(err => {
        response.json({
            ok: false,
            err
        });
    });
});
//Actualizar usuario
userRoutes.post('/update', autenticacion_1.verificaToken, (request, response) => {
    const user = {
        nombre: request.body.nombre || request.usuario.nombre,
        email: request.body.email || request.usuario.email,
        avatar: request.body.avatar || request.usuario.avatar,
    };
    usuario_model_1.Usuario.findByIdAndUpdate(request.usuario._id, user, { new: true }, (err, userDB) => {
        if (err)
            throw err;
        if (!userDB) {
            return response.json({
                ok: false,
                mensaje: 'No existe un usuario con ese ID'
            });
        }
        const tokenUser = token_1.default.getJwToken({
            _id: userDB._id,
            nombre: userDB.nombre,
            email: userDB.email,
            avatar: userDB.avatar,
        });
        response.json({
            ok: true,
            token: tokenUser
        });
    });
});
//
userRoutes.get('/login', autenticacion_1.verificaToken, (request, response) => {
    const usuario = request.usuario;
    response.json({
        ok: true,
        usuario
    });
});
exports.default = userRoutes;
