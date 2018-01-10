# Amarillo

A stateless GraphQL mock with stateful capabilities.

This library serves to act as a mock of one or many GraphQL graphs. It does so by making a small extension to the API of [graphql-tools](https://www.apollographql.com/docs/graphql-tools/mocking.html), and adding a cookie-based mechanism for keeping a small state representation on the client.


# Table of contents

  * [Amarillo](#amarillo)
  * [Table of contents](#table-of-contents)
  * [Requirements](#requirements)
  * [Getting started](#getting-started)
  * [Mock folder](#mock-folder)
  * [Mock format](#mock-format)
    * [Deltas](#deltas)
  * [Specifying a mock in your graphql query](#specifying-a-mock-in-your-graphql-query)
  * [Running the example](#running-the-example)


# Requirements

To use this library:

* A graphql schema string
* Proficiency in [graphql-tools mocking](https://www.apollographql.com/docs/graphql-tools/mocking.html)
* [Express.js](https://expressjs.com/)
  * A body-parser middleware
  * A cookie-parser middleware

To develop this library:

* Proficiency in [graphql-tools mocking](https://www.apollographql.com/docs/graphql-tools/mocking.html)
* Proficiency in [Express.js](https://expressjs.com/)
* Yarn `>= 1.0`

# Getting started

* Set up an express server with a body parser and cookie parser of your choice.
* Add a mock, or default mock - see [Mock folder](#mock-folder).
* Designate the mock folder in the environment variable `AMARILLO_MOCK_PATH`.
* Mount the Amarillo middleware on a path of your choice - e.g. `app.use('/gql-mock', amarillo);`.
* Start your server and start querying!

See [Running the example](#running-the-example) for an example and tips for getting started.

# Mock folder

Amarillo supports exactly one mock folder, with no subfolders. The mock folder contains all graph mocks, according to the [Mock format](#mock-format). The file name will denote the unique name of your mock, e.g `mocks/my-mock.js` will be given the unique name `my-mock`.

# Mock format

The mock format is inspired by the parameters provided when setting up a graphql mock in [graphql-tools](https://www.apollographql.com/docs/graphql-tools/mocking.html). A mock file must export a single object with the following fields:

* `typeDefs` - the graphql schema string to mock.
* `resolvers` - any resolvers to include. May be an empty object.
* `mocks` - The mocks to use, according to the format specified in [Customizing mocks](https://www.apollographql.com/docs/graphql-tools/mocking.html#Customizing-mocks).
* `deltas` - An array of deltas to apply, giving the mock client-driven statefulness. Specifying deltas will allow the mock to respond to the same query in different ways to simulate statefulness. See [Deltas](#deltas) for more info.
* `deltasCumulative` (optional) - A boolean indicating whether to apply deltas in a cumulative fashion. If true, all deltas up until, and including, the current delta index will be applied before sending the response, instead of only the delta at the delta index.

## Deltas

Each delta will override the mocking specified in the `mocks` field. The `deltas` will be merged with the `mocks`, overriding only what you specify in the deltas.

The deltas will be served round-robin, starting at index `0`. Once the last delta is served, the mock will serve one delta-free response and then start applyting deltas again.

The delta functionality stores a cookie in the client to indicate which delta to serve next. If the client does not support cookies the initial state will always be served.

# Specifying a mock in your graphql query

To specify which mock to use when responding to a query, the **optional header `x-graph-name`** can be set to the mocks `name`. How the `name` is created is described in [Mock folder](#mock-folder).

If the header is not set, a mock named `default` will be used. If there is no mock named `default` the service will respond with a `500`.

One way of doing this in your client per query is to use [the apollo client context](https://www.apollographql.com/docs/link/links/http.html#context)

# Running the example

* Check out the repo
* `yarn`
* `yarn example`
* visit http:localhost:4000/example.html to run examples

## Example queries

Paste these queries into a browser console and run several times to see how the response changes.

`cumulative` example

``` JavaScript
var data = JSON.stringify({
  "query": "{ search(text: \"foo\") { __typename } humanoid(id: \"foo\") { name } droid(id: \"foo\") { name } starship(id: \"foo\") { name } }",
  "variables": null,
  "operationName": null
});

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:4000/graphql");
xhr.setRequestHeader("content-type", "application/json");
xhr.setRequestHeader("x-graph-name", "cumulative");
xhr.setRequestHeader("cache-control", "no-cache");

xhr.send(data);
```

`random` example

``` JavaScript
var data = JSON.stringify({
  "query": "{ humanoid(id: \"foo\") { name } droid(id: \"foo\") { name } starship(id: \"foo\") { name } }",
  "variables": null,
  "operationName": null
});

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:4000/graphql");
xhr.setRequestHeader("content-type", "application/json");
xhr.setRequestHeader("x-graph-name", "random");
xhr.setRequestHeader("cache-control", "no-cache");

xhr.send(data);
```

`rotating` example

``` JavaScript
var data = JSON.stringify({
  "query": "{ humanoid(id: \"foo\") { name } droid(id: \"foo\") { name } starship(id: \"foo\") { name } }",
  "variables": null,
  "operationName": null
});

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "http://localhost:4000/graphql");
xhr.setRequestHeader("content-type", "application/json");
xhr.setRequestHeader("x-graph-name", "rotating");
xhr.setRequestHeader("cache-control", "no-cache");

xhr.send(data);
```
