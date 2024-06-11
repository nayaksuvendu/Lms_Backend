const {Router} = require ('express');
const userStats = require('../controler/AdminControler');

const router = Router();
router.get('/',userStats);

module.exports = router;