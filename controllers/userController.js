const Airtable = require('airtable');
const querystring = require('querystring');
const nodemailer = require('nodemailer');
const diffInMinutes = require('date-fns/difference_in_minutes');
const { validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const data = require('./dataController.js');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

const TABLE = base('users');
const VIEW = 'Grid view';

/**
 * Helper Functions
 */

const generateToken = (id, email) => {
  const source = `${id}${email}`;
  let token = '';
  for (let i = 0; i < source.length; i++) {
    token += source.charAt(Math.floor(Math.random() * source.length));
  }

  return token;
};

const generateLoginUrl = (token, email) => {
  let url = '';
  url = `login/magiclink/${token}?${querystring.stringify({ email })}`;
  return url;
};

const getUserByEmail = async (email) => {
  let record = {};
  const users = await data.getAirtableRecords(TABLE, VIEW);
  users.filter((user) => {
    if (user.get('email') === email) {
      record = {
        id: user.getId(),
        name: user.get('name'),
        email: user.get('email'),
        token: user.get('token'),
        date: user.get('token_date'),
      };
      return true;
    }
    return false;
  });

  return record;
};

// End Helper Functions

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.render('index', { errors: errors.array() });
    return;
  }

  TABLE.create({
    name: req.body.name,
    email: req.body.email,
  }, (err, record) => {
    if (err) { console.error(err); return; }

    // Generate Token
    const token = generateToken(record.getId(), req.body.email);

    TABLE.update(record.getId(), {
      token,
      token_date: (new Date()).toISOString(),
    }, (err, record) => {
      if (err) { console.error(err); return; }

      // Generate Magic Link
      req.body.url = generateLoginUrl(token, record.get('email'));

      // Send Email
      next();
    });
  });
};

exports.getLogin = (req, res) => {
  res.render('login', { title: 'Sign in to your profile' });
};


exports.createMagicLink = async (req, res, next) => {
  // Check if the user exists
  const user = await getUserByEmail(req.body.email);

  // If the user does not exist, let them know
  if (Object.entries(user).length === 0) {
    res.render('index', { message: 'User does not exist.' });
  }

  // Generate a token
  const token = generateToken(user.id, user.email);


  // Update token and token date
  TABLE.update(user.id, {
    token,
    token_date: (new Date()).toISOString(),
  }, (err, record) => {
    if (err) { console.error(err); return; }

    // Generate magic link
    const url = generateLoginUrl(token, user.email);

    // Send the magic link
    req.body.url = url;

    // Send Email
    next();
  });
};

exports.authenticate = async (req, res) => {
  const token = req.params.token;
  const email = req.query.email;
  const user = await getUserByEmail(email);

  if (Object.entries(user).length === 0) {
    res.render('index', { message: 'User does not exist.' });
  }

  if (user.email === email && user.token === token) {
    // Check if token is expired
    const isExpired = diffInMinutes(new Date(), user.date) > 5;

    if (isExpired) {
      res.render('login', { message: 'Magic link has expired. Enter your email to receive a new one.' });
    } else {
      res.render('profile', { user });
    }
  }
};

exports.sendEmail = (req, res) => {
  const to = req.body.email;
  const subject = 'Magic sign in link for My Sweet App';
  const body = `Hello,
  Here is your magic link for quickly signing into My Sweet App.
  <a href="http://localhost:7777/${req.body.url}">Sign in to My Sweet App</a>
  You can also copy and paste this link in your brower url bar.
  <a href="http://localhost:7777/${req.body.url}">http://localhost:7777/${req.body.url}</a>`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    // secure: true,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html: body,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      // email sent
      res.render('index', { message: 'Please check your email for your magic sign in link' });
    }
  });
};
