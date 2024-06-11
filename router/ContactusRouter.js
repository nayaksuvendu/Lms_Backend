const {Router} = require ('express');
const conatactUs = require('../controler/ContactUsControler');

const router = Router();
router.post('/',conatactUs);

module.exports = router;
