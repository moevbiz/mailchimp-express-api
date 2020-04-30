require('dotenv').config()
const config = require('./config.js');

const express = require('express')
const request = require('request')
const router = express.Router()
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 5000

// readable json format
app.set('json spaces', 2)


// cors options
const whitelist = process.env.WHITELIST.split(',')
whitelist.push(`http://localhost:${port}`, `http://127.0.0.1:${port}`) // allow localhost to access api

const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback('Not allowed by CORS')
    }
  }
}
app.use(cors())

// Bodyparser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// static files
app.use(express.static(path.join(__dirname, 'public')))
// routing
app.use(process.env.BASE_URL || '/', router);

router.get('/signup', (req, res) => {
    res.redirect(process.env.SIGNUP_REDIRECT) // provide url of mailchimp hosted signup if client js malfunctions
})

router.post('/signup', cors(corsOptions), (req, res) => {
    console.log(req.body);
    const { email, submit, b_f8 } = req.body

    console.log(email, submit, b_f8)

    if (b_f8 && b_f8.length > 0) return res.send('pot')
    if (!email || email.length < 1) return res.send('noinput')

    // construct req data
    const data = {
        members: [
            {
                email_address: email, 
                status: 'pending'
            }
        ]
    }

    const options = {
        url: process.env.LIST_URL, // mailchimp URL w/ list ID
        method: 'POST',
        headers: {
            Authorization: process.env.API_TOKEN // need api token
        },
        update_existing: true,
        body: JSON.stringify(data)
    }

    // make request to mailchimp API
    request(options, (err, response, body) => {
        if (err) {
          res.send(err);
        } else {
          if (response.statusCode === 200) {
            res.send(JSON.parse(response.body));
          } else {
            res.send(['failed to update list']);
          }
        }
    });
})

app.listen(port, console.log(`Server started on port ${port}`))