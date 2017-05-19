# node-dike

Master Build Status: [![Build Status](https://travis-ci.org/four43/node-dike.svg?branch=master)](https://travis-ci.org/four43/node-dike)

(Very much work in progress)

A drop in stream control and utility library for modern node.js (>v4). Aims to be the fs-extra of Node streams. ... A lofty goal, we'll see.

Heavily influenced by [mississippi](https://github.com/maxogden/mississippi) and their research into the oddities of node streams.

## Transform

A drop-in replacement for stream.Transform. It provides:

* Improved error handling - Errors thrown in the transform function are caught and sent as errors down the stream.
* continueOnError Option - Errors will be emitted as "error" events, but the transformer will continue to ingest the input stream.
* Promises - Transform stream is "Promisified", fully usable with async/await, no returning "new Promise" etc. 
