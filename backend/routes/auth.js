import Router from "express-promise-router";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from 'bcrypt';
import * as db from '../db/index.js'

const router = new Router();
const saltRounds = 10;

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const query = 'SELECT * FROM users WHERE username = $1';
  
  try {
    const { rows } = await db.query(query, [username]);
    const row = rows[0];
    
    if (!row) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
    
    const isMatch = await bcrypt.compare(password, row.hashed_pw);
    if (!isMatch) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
    
    return cb(null, row);
  } catch (err) {
    console.error('Database query error:', err);
    return cb(err);
  }
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

router.post('/login/password', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Hash the password
    const hashedPw = await bcrypt.hash(password, saltRounds);

    // Insert user into the database
    const query = `
      INSERT INTO users (username, email, hashed_pw)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(query, [username, email, hashedPw]);

    // Extract the created user
    const user = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email
    };

    // Log the user in immediately after signup
    req.login(user, function(err) {
      if (err) {
        return next(err);
      }

      // Return the newly created user (without password for security)
      return res.status(201).json({
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
      });
    });

    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
