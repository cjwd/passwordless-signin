const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Magic Links' });
});

router.post('/signup',
  userController.signUp,
  userController.sendEmail);


router.get('/login', userController.getLogin);
router.post('/login',
  userController.createMagicLink,
  userController.sendEmail);
router.get('/login/magiclink/:token', userController.authenticate);

module.exports = router;
