"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const autenticacion_1 = require("../middlewares/autenticacion");
const post_model_1 = require("../models/post.model");
const file_system_1 = __importDefault(require("../classes/file-system"));
const postRoutes = express_1.Router();
const fileSystem = new file_system_1.default();
//obtener posts paginados
postRoutes.get('/', autenticacion_1.verificaToken, (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    let pagina = Number(request.query.pagina) || 1;
    let skip = pagina - 1;
    skip = skip * 10;
    const posts = yield post_model_1.Post.find()
        .sort({
        _id: -1
    })
        .skip(skip)
        .limit(10)
        .populate('usuario', '-password')
        .exec();
    response.json({
        ok: true,
        pagina,
        posts
    });
}));
//crear post
postRoutes.post('/', autenticacion_1.verificaToken, (request, response) => {
    const body = request.body;
    body.usuario = request.usuario._id;
    const imagenes = fileSystem.imagenesDeTempHaciaPost(request.usuario._id);
    body.imgs = imagenes;
    post_model_1.Post.create(body).then((postDB) => __awaiter(void 0, void 0, void 0, function* () {
        yield postDB.populate('usuario', '-password').execPopulate();
        response.json({
            ok: true,
            post: postDB
        });
    })).catch(err => {
        response.json(err);
    });
});
// Servicio para subir archivos
postRoutes.post('/upload', autenticacion_1.verificaToken, (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    if (!request.files) {
        return response.status(400).json({
            ok: false,
            mensaje: 'No se subió algún archivo',
            request: '.file: ' + request.files
        });
    }
    const file = request.files.image;
    if (!file) {
        return response.status(400).json({
            ok: false,
            mensaje: 'No se subió algún archivo - image'
        });
    }
    if (!file.mimetype.includes('image')) {
        return response.status(400).json({
            ok: false,
            mensaje: 'lo que subió no es una imagen'
        });
    }
    yield fileSystem.guardarImagenTemporal(file, request.usuario._id);
    response.json({
        ok: true,
        file: file.mimetype
    });
}));
// Servicio para subir archivos
postRoutes.get('/imagen/:userid/:img', (request, response) => {
    const userId = request.params.userid;
    const img = request.params.img;
    const pathFoto = fileSystem.getFotoUrl(userId, img);
    response.sendFile(pathFoto);
});
exports.default = postRoutes;
