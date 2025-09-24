import { Router } from 'express';
import { AssetController } from '../controllers/assetController';

const router = Router();

router.post('/', AssetController.createAsset);
router.get('/', AssetController.listAssets);
router.get('/:assetId', AssetController.getAssetById);
router.get('/symbol/:symbol', AssetController.getAssetBySymbol);

export default router;