const { graphqlExpress } = require('apollo-server-express');
const { addMockFunctionsToSchema, makeExecutableSchema } = require('graphql-tools');
const { generateMock } = require('./utils');

const { AMARILLO_MOCK_PATH } = process.env;
const AMARILLO_HEADER_NAME = process.env.AMARILLO_HEADER_NAME || 'amarillo-graph-name';
if (!AMARILLO_MOCK_PATH) {
  throw new Error('[Amarillo] Environment variable AMARILLO_MOCK_PATH missing');
}

// generate a mock middleware from a name
const generateMockMiddleware = ({ req, res, graphName = 'default' }) => {
  const mock = require(`${AMARILLO_MOCK_PATH}/${graphName}`); // eslint-disable-line
  const {
    typeDefs,
    resolvers,
    deltas,
    deltasCumulative,
  } = mock;
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const mocksWithDeltas = generateMock({
    deltas,
    deltasCumulative,
    req,
    res,
    graphName,
    mocks: mock.mocks,
  });

  addMockFunctionsToSchema({ schema, mocks: mocksWithDeltas, preserveResolvers: true });
  return graphqlExpress({ schema });
};

// set up routes
module.exports = (req, res, next) => {
  const graphName = req.headers[AMARILLO_HEADER_NAME];
  const middleware = generateMockMiddleware({ req, res, graphName });

  // If we've found a middleware - let it handle the response.
  // Otherwise, respond with a 500.
  return middleware ?
    middleware(req, res, next) :
    res.status(500).send(`No compatible graph found for name "${graphName}"`);
};
