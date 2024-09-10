require('dotenv').config();
const express = require('express');
const path = require('path');
const { title } = require('process');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const axios = require('axios');
const http = require('http');
const socketIO = require('socket.io');
const TelegramBot = require('node-telegram-bot-api')


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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

app.get('/features', (req, res) => {
  res.render('features', { title: 'Features', sitetitle: 'Pick n Ink', branch: 'Pick n Ink', features: ['Feature 1', 'Feature 2', 'Feature 3'] });
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
