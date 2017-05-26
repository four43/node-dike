# node-dike

Master Build Status: [![Build Status](https://travis-ci.org/four43/node-dike.svg?branch=master)](https://travis-ci.org/four43/node-dike)

(Very much work in progress)

A drop in stream control and utility library for modern node.js (v4.x+). Aims to be the fs-extra of Node streams. ... A lofty goal, we'll see.

Heavily influenced by [mississippi](https://github.com/maxogden/mississippi) and their research into the oddities of node streams.

## Motivation

So why make another stream library?

* Streams are really powerful - You can do so much with Linux's GNU utilities and pipes.
* Streams are great for larger data sets and processing bits at a time. Node's built in streams with high watermark functionality is nice.

__BUT!__
* Node streams don't always behave as you would expect.
* Typings would be nice to make sure you're plugging in things that go together.
* `async`/`await` makes JavaScript much nicer, streams should play nice in that environment too.
* Strange flowing states - `.pause()` gets unpaused automagically with `.pipe()` and `.on('data')` and probably something else. If you explicitly pause a stream with `.halt()`, it will stay paused until you `.continue()` it.


This should be how modern NodeJS streams are used:
```javascript
async () => {
	try {
		const readable = fs.createReadStream('./my-big-file.csv');
		const writable = fs.createWriteStream('./trimmed-down.json');
		
		await readable
			.pipe(new Transform({
				transform: (chunk, encoding) => {
					// Some logic, just return when done would be nice.
					return result;
				}
			}))
			.pipe(writable);
		
		console.log(`Yay, we're done`);
	}
	catch(err) {
		// Streams should be cleaned up in a memory efficient way.
		console.error(`something went wrong!\n${err.stack}`);
	}
}
```

## dike 
_(n.) a ditch or watercourse._

A drop-in replacement for modern Node.js streams that provides modern functionality, type safety, and memory management by default. Dike enhances streams, not override them with basic event emitters with added functionality. It is tested and big data friendly.


### enhance(NodeJS.ReadableStream)

Enhance an existing stream with:

* **Promises** Readable stream is "Promisified", fully usable with async/await, no returning "new Promise" etc. 

### Transform

A drop-in replacement for stream.Transform. It provides:

* **Improved error handling** - Errors thrown in the transform function are caught and sent as errors down the stream.
* **continueOnError Option** - Errors will be emitted as "error" events, but the transformer will continue to ingest the input stream.
* **Promises** - Transform stream is "Promisified", fully usable with async/await, no returning "new Promise" etc. 

### Todo

* enhance(stream) - A wrapper that turns a regular stream into one one with improved error handling, continueOnError, Promises, and fork.
* .pipe() Type Safety - Pipe streams together but show warnings if the types are incorrect.
* fork - A method that allows a stream to be piped to multiple targets (really just pause, pipe x times, unpause) to prevent data loss.
