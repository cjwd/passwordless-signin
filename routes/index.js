const express = require('express');
const router = express.Router();
const { check } = require('express-validator/check');
const userController = require('../controllers/userController');

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Magic Links' });
});

router.post('/signup', [
  check('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Your name cannot be just one character')
    .not()
    .isEmpty()
    .withMessage('You do have a name don\'t you?')
    .trim()
    .escape(),
  check('email')
    .isEmail()
    .withMessage('Invalid email')
    .not()
    .isEmpty()
    .withMessage('You need to supply an email address'),
],
userController.signUp,
userController.sendEmail);


router.get('/login', userController.getLogin);
router.post('/login',
  userController.createMagicLink,
  userController.sendEmail);
router.get('/login/magiclink/:token', userController.authenticate);

module.exports = router;
