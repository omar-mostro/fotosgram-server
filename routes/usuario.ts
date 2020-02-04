import {request, Router} from "express";
import {Usuario} from "../models/usuario.model";
import bcrypt from "bcrypt";
import Token from "../classes/token";
import {verificaToken} from "../middlewares/autenticacion";

const userRoutes = Router();

//Login
userRoutes.post('/login', (request, response) => {

    const body = request.body;

    Usuario.findOne({
        email: body.email
    }, (err, userDB) => {
        if (err) throw err;

        if (!userDB) {
            return response.json({
                ok: false,
                mensaje: 'Usuario/contraseña no son correctos'
            })
        }

        if (userDB.compararPassword(body.password)) {

            const tokenUser = Token.getJwToken({
                _id: userDB._id,
                nombre: userDB.nombre,
                email: userDB.email,
                avatar: userDB.avatar,
            });

            return response.json({
                ok: true,
                token: tokenUser
            })
        } else {
            return response.json({
                ok: false,
                mensaje: 'Usuario o conraseña incorrecta ***'
            })
        }
    })

});

userRoutes.post('/create', (request, response) => {

    const user = {
        nombre: request.body.nombre,
        email: request.body.email,
        password: bcrypt.hashSync(request.body.password, 10),
        avatar: request.body.avatar,
    };

    Usuario.create(user).then(userDB => {

        const tokenUser = Token.getJwToken({
            _id: userDB._id,
            nombre: userDB.nombre,
            email: userDB.email,
            avatar: userDB.avatar,
        });


        response.json({
            ok: true,
            token: tokenUser
        })
    })
        .catch(err => {
            response.json({
                ok: false,
                err
            })
        });

});

//Actualizar usuario
userRoutes.post('/update', verificaToken, (request: any, response) => {

    const user = {
        nombre: request.body.nombre || request.usuario.nombre,
        email: request.body.email || request.usuario.email,
        avatar: request.body.avatar || request.usuario.avatar,
    };

    Usuario.findByIdAndUpdate(request.usuario._id, user, {new: true}, (err, userDB) => {
        if (err) throw err;

        if (!userDB) {
            return response.json({
                ok: false,
                mensaje: 'No existe un usuario con ese ID'
            })
        }

        const tokenUser = Token.getJwToken({
            _id: userDB._id,
            nombre: userDB.nombre,
            email: userDB.email,
            avatar: userDB.avatar,
        });

        response.json({
            ok: true,
            token: tokenUser
        })
    });

});

//
userRoutes.get('/login', verificaToken, (request: any, response) => {

    const usuario = request.usuario;


    response.json({
        ok: true,
        usuario
    })

});


export default userRoutes;
