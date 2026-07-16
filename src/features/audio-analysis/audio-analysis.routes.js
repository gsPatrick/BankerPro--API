import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { MAX_AUDIO_BYTES } from '../../providers/transcription/transcription.provider.js';
import * as audioAnalysisController from './audio-analysis.controller.js';

const router = Router();

// Diretório separado do /uploads de avatares: aqui o arquivo é temporário e o
// service o apaga assim que a transcrição termina.
const AUDIO_TMP_DIR = './uploads/audio-tmp';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(AUDIO_TMP_DIR, { recursive: true });
    cb(null, AUDIO_TMP_DIR);
  },
  filename: (req, file, cb) => {
    const unico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // A extensão precisa sobreviver: é por ela que decidimos o mime type
    // enviado ao serviço de transcrição.
    const ext = path.extname(file.originalname) || '.mp3';
    cb(null, `negociacao-${unico}${ext}`);
  }
});

// O WhatsApp grava em ogg/opus, o navegador em webm, e uploads costumam ser
// mp3/m4a — todos precisam passar.
const EXTENSOES_ACEITAS = /\.(mp3|mp4|m4a|ogg|oga|opus|wav|webm|mpeg|mpga)$/i;

const fileFilter = (req, file, cb) => {
  const extOk = EXTENSOES_ACEITAS.test(file.originalname);
  const mimeOk = /^(audio|video)\//.test(file.mimetype);
  if (extOk && mimeOk) {
    return cb(null, true);
  }
  cb(new Error('Formato de áudio não suportado. Envie mp3, m4a, ogg, wav ou webm.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_AUDIO_BYTES }
});

// Sem isto, um arquivo grande demais estoura como erro 500 sem explicação.
const uploadAudio = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'O áudio ultrapassa o limite de 25MB. Envie um trecho menor da negociação.'
      : err.message;
    return res.status(400).json({ success: false, error: { message, code: 'AUDIO_UPLOAD_FAILED' } });
  });
};

router.use(requireAuth);
router.use(requirePermission('analise_audio'));

router.route('/')
  .get(audioAnalysisController.getAnalyses)
  .post(uploadAudio, audioAnalysisController.createAnalysis);

router.route('/:id')
  .get(audioAnalysisController.getAnalysis)
  .delete(audioAnalysisController.deleteAnalysis);

export default router;
