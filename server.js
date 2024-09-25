require('dotenv').config();
const express = require('express');
const path = require('path');
const { title } = require('process');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const socketIO = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const req = require('express/lib/request');
const res = require('express/lib/response');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const saltRounds = 10; //For bcrypt hashing

// MySQL connection
const db = mysql.createConnection ({
  host: process.env.DBHOST,
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  database: process.env.DBBASE
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to database');
});

// Telegram Bot setup
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(telegramBotToken, { polling: true });




// Set EJS as the template engine
app.set('view engine', 'ejs');

// Set the directory for EJS templates
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json());


// Session setup
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.admin) {
    return next();
  } else {
    res.redirect('/admin/login');
  }
}

// Admin Login Page (GET)
app.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

// Handle Admin Login (POST)
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Username entered:', username); // Debugging

  const query = 'SELECT * FROM admins WHERE LOWER(username) = LOWER(?)';
  db.query(query, [username.trim()], (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Database error');
    };

    if (results.length > 0) {
      const admin = results[0];
      console.log('Admin Found:', admin); // Debugging

      //Compare hashed password
      bcrypt.compare(password, admin.password, (err, isMatch) => {
        if (isMatch) {
          req.session.admin = admin; // Save admin in session
          newFunction(); // Redirect to dashboard
        } else {
          res.send('Invalid Credentials'); // Incorrect Password
        } 


        function newFunction() {
          res.redirect('dashboard');
        }
      });
    } else {
      console.log('Admin not found');
      res.send('Admin not found'); // Admin username doesnt exist
     }
  });
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin Dashboard (Protected Route)
app.get('/admin/dashboard', isAuthenticated, (req, res) => {
  res.render('admin/dashboard', { admin: req.session.admin});
});

// Add Product Page (Protected Route)
app.get('/admin/add-product', isAuthenticated, (req, res) => {
  res.render('admin/add-product');
});
// Handle add product (post)
app.post('/admin/add-product', isAuthenticated, (req, ress) => {
  const { name, description, image_url, category, stock, price_brackenfell, price_strand } =req.body;

  const query = 'INSERT INTO products (name, description, image_url, category, stock, price_brackenfell, price_strand) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, description, image_url, category, stock, price_brackenfell, price_strand], (err, result) => {
    if (err) throw err;
    res.send('Product added successfully');
  });
});

// Admin Registertion Page (GET)
app.get('admin/register', (req, res) => {
  res.render('register');
});

// Handle Admin Registration (POST)
app.post('/admin/register', (req, res) =>{
  const { username, password } = req.body;

  console.log('Registering new admin:', username); // Debugging

  // Check if username already exist
  const checkQuery = 'SELECT * FROM admins WHERE username = ?';
  db.query(checkQuery, [username.trim()], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      // Username already exist
      res.send('Username already exist.');
    } else {
      // Hash pasword and save admin to database
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) throw err;
      
        const query = 'INSERT INTO admins (username, password) VALUES (?, ?)';
        db.query(query, [username.trim(), hash], (err, results) => {
          if (err) throw err;
          console.log('Admin registered successfully:', results); // Debugging
          res.redirect('/login'); // Redirect to login after succsefull
        });
      });
    }
  });
});


// Routes
app.get('/', (req, res) => {
  res.render('index', { title: 'Home', sitetitle: 'Pick n Ink', branch: 'Pick n Ink', description: 'Welcome to My Node.js Website' });
});

app.get('/bprice', (req, res) => {
    res.render('bprice', { title: 'Price', sitetitle: 'Pick n Ink', branch: 'Brackenfell', description: 'Our Price list' });
});

app.get('/sprice', (req, res) => {
    res.render('sprice', { title: 'Price', sitetitle: 'Pick n Ink', branch: 'Strand', description: 'Our Price list' });
})

app.get('/service', (req, res) => {
  res.render('service', { title: 'Service', sitetitle: 'Pick n Ink', branch: 'Pick n Ink', features: ['Feature 1', 'Feature 2', 'Feature 3'] });
});

app.get('/products', (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Database query error');
    }
    console.log(results); // Debugging output
    res.render('product', { products: results });
  });
});

app.get('/babout', (req, res) => {
    res.render('babout', { title: 'About Us', sitetitle: 'Pick n Ink', description: 'About us', branch: 'Brackenfell'});
});

app.get('/sabout', (req, res) => {
    res.render('sabout', { title: 'About Us', sitetitle: 'Pick n Ink', description: 'About us', branch: 'Strand'});
})

app.get('/bcontact', (req, res) => {
    res.render('bcontact', { title: 'Contact Us', sitetitle: 'Pick n Ink', branch: 'Brackenfell', description: 'Contact us' });
});

app.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', sitetitle: 'Pick n Ink', });
});

app.get('/register', (req, res) => {
  res.render('admin/register', { title: 'Admin Register', sitetitle: 'Pick n Ink'});
});


// Handle form submission and send emails
app.post('/bcontact', async (req, res) => {
    const { name, surname, email, contactNumber, message, 'g-recaptcha-response': recaptchaResponse } = req.body;
  
    // Verify reCAPTCHA
    try {
      const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaResponse
        }
      });
  
      const { success } = response.data;
      if (!success) {
        return res.status(400).send('reCAPTCHA verification failed. Please try again.');
      }
  
      // Create a transporter using your SMTP server
      const transporter = nodemailer.createTransport({
        host: process.env.BSMTP_HOST,  // SMTP host from .env
        port: process.env.BSMTP_PORT,  // SMTP port from .env
        secure: process.env.BSMTP_PORT == 465,  // Use SSL for port 465
        secure: false,
        auth: {
          user: process.env.BSMTP_USER,  // SMTP user from .env
          pass: process.env.BSMTP_PASS   // SMTP password from .env
        },
        tls: {
            minVersion: 'TLSv1.2',
          rejectUnauthorized: false
        },
      });
  
      // Email to the server/admin
      const mailToServer = {
        from: email,
        to: process.env.BADMIN_EMAIL,  // Admin email from .env
        subject: `New Contact Us Message from ${name} ${surname}`,
        text: `
          Name: ${name} ${surname}
          Email: ${email}
          Contact Number: ${contactNumber}
          Message: ${message}
        `
      };
  
      // Email to the client
      const mailToClient = {
        from: process.env.BSMTP_USER,
        to: email,
        subject: 'Thank you for contacting us!',
        text: `
          Dear ${name},
  
          Thank you for getting in touch! We have received your message and will get back to you soon.
  
          Your message:
          ${message}
  
          Best regards,
          Pick n Ink Team
        `
      };
  
      // Send both emails
      await transporter.sendMail(mailToServer);
      await transporter.sendMail(mailToClient);
  
      res.send('Thank you for contacting us. We will get back to you soon!');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred. Please try again later.');
    }
});

// GeoLocation

app.get('/getPrice', (req, res) => {
  const { lat, long } = req.query;

  const brackenfell = { lat: -33.8786, long: 18.7051, price: 100 };
  const strand = { lat: -34.1065, long: 18.8275, price: 120 };

  const distanceToBrackenfell = calculateDistance(lat, long, brackenfell.lat, brackenfell.long);
  const distanceToStrand = calculateDistance(lat, long, strand.lat, strand.long);

  let closestBranch;
  if (distanceToBrackenfell < distanceToStrand) {
    closestBranch = brackenfell;
  } else {
    closestBranch = strand;
  }

  res.json({ branch: closestBranch, price: closestBranch.price });
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}


app.get('/scontact', (req, res) => {
    res.render('scontact', { title: 'Contact Us', sitetitle: 'Pick n Ink', branch: 'Strand', description: 'Contact us' });
});

// Handle form submission and send emails
app.post('/scontact', async (req, res) => {
    const { name, surname, email, contactNumber, message, 'g-recaptcha-response': recaptchaResponse } = req.body;
  
    // Verify reCAPTCHA
    try {
      const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaResponse
        }
      });
  
      const { success } = response.data;
      if (!success) {
        return res.status(400).send('reCAPTCHA verification failed. Please try again.');
      }
  
      // Create a transporter using your SMTP server
      const transporter = nodemailer.createTransport({
        host: process.env.SSMTP_HOST,  // SMTP host from .env
        port: process.env.SSMTP_PORT,  // SMTP port from .env
        // secure: process.env.SSMTP_PORT == 465,  // Use SSL for port 465
        auth: {
          user: process.env.SSMTP_USER,  // SMTP user from .env
          pass: process.env.SSMTP_PASS   // SMTP password from .env
        }
      });
  
      // Email to the server/admin
      const mailToServer = {
        from: email,
        to: process.env.SADMIN_EMAIL,  // Admin email from .env
        subject: `New Contact Us Message from ${name} ${surname}`,
        text: `
          Name: ${name} ${surname}
          Email: ${email}
          Contact Number: ${contactNumber}
          Message: ${message}
        `
      };
  
      // Email to the client
      const mailToClient = {
        from: process.env.SSMTP_USER,
        to: email,
        subject: 'Thank you for contacting us!',
        text: `
          Dear ${name},
  
          Thank you for getting in touch! We have received your message and will get back to you soon.
  
          Your message:
          ${message}
  
          Best regards,
          Pick n Ink Team
        `
      };
  
      // Send both emails
      await transporter.sendMail(mailToServer);
      await transporter.sendMail(mailToClient);
  
      res.send('Thank you for contacting us. We will get back to you soon!');
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred. Please try again later.');
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
