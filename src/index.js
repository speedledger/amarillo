const { graphqlExpress } = require('apollo-server-express');
const { addMockFunctionsToSchema, makeExecutableSchema } = require('graphql-tools');
const { merge, isFinite, cloneDeep } = require('lodash');

const { AMARILLO_MOCK_PATH } = process.env;

/**
 * Uses information from the request and the mock to determine
 * which deltas to merge into the provided graph mock.
 * This function mutates the res and mocks parameters.
 */
const mergeDeltas = ({
  req,
  res,
  graphName,
  deltas,
  deltasCumulative,
  mocks,
}) => {
  let deltaIndex = parseInt(req.cookies[graphName], 10);

  // if the graph mock has specified deltas, apply any valid deltas.
  if (deltas.length) {
    if (isFinite(deltaIndex)) {
      if (deltasCumulative) {
        // cumulatively add all deltas, if that option is enabled.
        deltas.forEach((obj, index) => {
          if (index <= deltaIndex) {
            merge(mocks, deltas[index]);
          }
        });
      } else if (deltaIndex >= 0) {
        // add a single delta
        merge(mocks, deltas[deltaIndex]);
      }

      // increase deltaIndex so that the response cookie contains the next index.
      deltaIndex += 1;
      if (deltaIndex >= deltas.length) {
        // magic number that reboots the delta sequence to a non-delta-including state,
        // if we've just applied the last delta in the sequence.
        // This has the same effect for the client as not having communicated with the mock before,
        // - starting over from the non-delta-including state.
        deltaIndex = -1;
      }
    } else {
      // if the mock contains deltas but the deltaIndex is not set, or is not a finite number,
      // set it in the res cookies.
      // This means that the first response will contain mocks without deltas (as intended).
      deltaIndex = 0;
    }
  }

  // set a cookie on the client so that any subsequent requests indicate which delta(s) to apply.
  res.cookie(graphName, deltaIndex);
};

// generate a mock middleware from a name
const generateMockMiddleware = ({ req, res, graphName = 'default' }) => {
  const mock = require(`${AMARILLO_MOCK_PATH}/${graphName}`); // eslint-disable-line
  const { typeDefs, resolvers } = mock;
  // deep clone the mock so that any mutations do not propagate outside of this response
  const mocks = cloneDeep(mock.mocks);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  mergeDeltas({
    req,
    res,
    graphName,
    ...mock,
    mocks,
  });

  addMockFunctionsToSchema({ schema, mocks, preserveResolvers: true });
  return graphqlExpress({ schema });
};

// set up routes
module.exports = (req, res, next) => {
  const graphName = req.headers['x-graph-name'];
  const middleware = generateMockMiddleware({ req, res, graphName });

  // If we've found a middleware - let it handle the response.
  // Otherwise, respond with a 500.
  return middleware ?
    middleware(req, res, next) :
    res.status(500).send(`No compatible graph found for name "${graphName}"`);
};
