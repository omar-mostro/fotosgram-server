import {Router} from "express";
import {verificaToken} from "../middlewares/autenticacion";
import {Post} from "../models/post.model";
import {FileUpload} from "../middlewares/file-upload";
import FileSystem from "../classes/file-system";

const postRoutes = Router();
const fileSystem = new FileSystem();

//obtener posts paginados
postRoutes.get('/', verificaToken, async (request: any, response) => {


    let pagina = Number(request.query.pagina) || 1;
    let skip = pagina - 1;
    skip = skip * 10;

    const posts = await Post.find()
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
    })
});

//crear post
postRoutes.post('/', verificaToken, (request: any, response) => {

    const body = request.body;

    body.usuario = request.usuario._id;

    const imagenes = fileSystem.imagenesDeTempHaciaPost(request.usuario._id);
    body.imgs = imagenes;

    Post.create(body).then(async postDB => {

        await postDB.populate('usuario', '-password').execPopulate();

        response.json({
            ok: true,
            post: postDB
        })
    }).catch(err => {
        response.json(err);
    });


});

// Servicio para subir archivos
postRoutes.post('/upload', verificaToken, async (request: any, response) => {
    if (!request.files) {
        return response.status(400).json({
            ok: false,
            mensaje: 'No se subió algún archivo',
            request: '.file: '+request.files
        })
    }

    const file: FileUpload = request.files.image;

    if (!file) {
        return response.status(400).json({
            ok: false,
            mensaje: 'No se subió algún archivo - image'
        })
    }

    if (!file.mimetype.includes('image')) {
        return response.status(400).json({
            ok: false,
            mensaje: 'lo que subió no es una imagen'
        })
    }

    await fileSystem.guardarImagenTemporal(file, request.usuario._id);

    response.json({
        ok: true,
        file: file.mimetype
    });
});

// Servicio para subir archivos
postRoutes.get('/imagen/:userid/:img', (request: any, response) => {

    const userId = request.params.userid;
    const img = request.params.img;

    const pathFoto = fileSystem.getFotoUrl(userId, img);

    response.sendFile(pathFoto);

});

export default postRoutes;
