process.env.AMARILLO_MOCK_PATH = `${__dirname}/mocks`;

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { graphiqlExpress } = require('apollo-server-express');
const amarillo = require('amarillo');

const PORT = process.env.PORT || 4000;
const app = express();

app.all('/', (req, res) => res.redirect('/index.html'));
app.get('/index.html', (req, res) => {
  // send the example page
  res.sendFile(`${__dirname}/index.html`);
});

app.all('*', (req, res, next) => {
  // Respond with a 200 to potential pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  return next();
});

// Set up parser middleware - required for amarillo
app.use(cookieParser());
app.use(bodyParser.json());

// set up graphiql - not required but neat
app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));
// mount amarillo middleware
app.use('/graphql', amarillo);

app.listen(PORT, () => { console.log(`Running at port ${PORT}`); });
