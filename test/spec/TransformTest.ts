import * as stream from "stream";
import Transform from "../../src/Stream/Transform";
import * as sinon from "sinon";
import * as assert from "assert";
import spyOnStream from "../util/spyOnStreams";
import wait from "../util/wait";

let input: stream.PassThrough;

beforeEach(() => {
	input = new stream.PassThrough();
});

describe("Transform", () => {
	
	describe("Existing functionality", () => {
		it("should transform stream sanity check", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			const transform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 0);
					assert.strictEqual(dataSpy.callCount, 4);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(dataSpy.args[3][0].toString(), 'Part D');
					assert.strictEqual(endSpy.callCount, 1);
					assert.strictEqual(finishSpy.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(closeSpy.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should behave like a normal transform stream", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			const transform = new Transform({
				transform: (chunk: string, encoding, callback) => {
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 0);
					assert.strictEqual(dataSpy.callCount, 4);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(dataSpy.args[3][0].toString(), 'Part D');
					assert.strictEqual(endSpy.callCount, 1);
					assert.strictEqual(finishSpy.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(closeSpy.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should behave like a normal transform stream - start paused", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			const transform = new Transform({
				transform: (chunk: string, encoding, callback) => {
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			input.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 0);
					assert.strictEqual(dataSpy.callCount, 4);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(dataSpy.args[3][0].toString(), 'Part D');
					assert.strictEqual(endSpy.callCount, 1);
					assert.strictEqual(finishSpy.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(closeSpy.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should behave like a normal transform stream - error throwing", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform<string, string>({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const finishedSpy = sinon.spy();
			const endSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finished', finishedSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 1);
					assert.strictEqual(errSpy.args[0][0], transformError);
					assert.strictEqual(dataSpy.callCount, 1);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(endSpy.callCount, 0);
					assert.strictEqual(finishedSpy.callCount, 0);
					assert.strictEqual(closeSpy.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should behave like a normal transform in object mode", (done) => {
			input = new stream.PassThrough({
				readableObjectMode: true,
				writableObjectMode: true,
			});
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform({
				readableObjectMode: true,
				writableObjectMode: true,
				transform: (chunk, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy);
			
			input.write({key: 'A', value: 'Hello'});
			input.write({key: 'B', value: 'World'});
			input.write({key: 'C', value: 'Nice'});
			input.write({key: 'D', value: 'Day'});
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(dataSpy.callCount, 1);
					assert.deepEqual(dataSpy.args[0][0], {key: 'A', value: 'Hello'});
					assert.strictEqual(errSpy.callCount, 1);
					assert.deepEqual(errSpy.args[0][0], transformError);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		})
		
	});
	
	describe("Improved Error Handling", () => {
		
		it("should behave like a normal transform stream - error throwing", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform<string, string>({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						throw transformError;
					}
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const finishedSpy = sinon.spy();
			const endSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finished', finishedSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 1);
					assert.strictEqual(errSpy.args[0][0], transformError);
					assert.strictEqual(dataSpy.callCount, 1);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(endSpy.callCount, 0);
					assert.strictEqual(finishedSpy.callCount, 0);
					assert.strictEqual(closeSpy.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
	});
	
	describe("stopOnError Option", () => {
		
		it("should continue on error", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform({
				continueOnError: true,
				transform: (chunk, encoding, callback) => {
					setTimeout(() => {
						chunkCount++;
						if (chunkCount == 2) {
							console.log(`Callback error`);
							return callback(transformError);
						}
						console.log(`Callback chunk ${chunk}`);
						return callback(null, chunk);
					}, 1);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 1);
					assert.strictEqual(errSpy.args[0][0], transformError);
					assert.strictEqual(dataSpy.callCount, 3);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(dataSpy.args[2][0].toString(), 'Part D');
					assert.strictEqual(finishSpy.callCount, 1);
					assert.strictEqual(endSpy.callCount, 1);
					assert.strictEqual(closeSpy.callCount, 0);
					done()
				}
				catch (err) {
					done(err);
				}
			}, 20);
		});
		
		it("should continue on error (async)", async () => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform({
				continueOnError: true,
				transform: async (chunk, encoding) => {
					chunkCount++;
					if (chunkCount == 2) {
						console.log(`Throwing error`);
						throw transformError;
					}
					console.log(`Sending chunk ${chunk}`);
					return chunk;
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			
			const pipeline = input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end();
			
			await pipeline;
			
			assert.strictEqual(errSpy.callCount, 1);
			assert.strictEqual(errSpy.args[0][0], transformError);
			assert.strictEqual(dataSpy.callCount, 3);
			assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
			assert.strictEqual(dataSpy.args[2][0].toString(), 'Part D');
			assert.strictEqual(finishSpy.callCount, 1);
			assert.strictEqual(endSpy.callCount, 0);
			assert.strictEqual(closeSpy.callCount, 0);
		});
		
		it("should continue on error in object mode", (done) => {
			input = new stream.PassThrough({
				readableObjectMode: true,
				writableObjectMode: true,
			});
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform({
				continueOnError: true,
				readableObjectMode: true,
				writableObjectMode: true,
				transform: (chunk, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			input.write({key: 'A', value: 'Hello'});
			input.write({key: 'B', value: 'World'});
			input.write({key: 'C', value: 'Nice'});
			input.write({key: 'D', value: 'Day'});
			input.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(errSpy.callCount, 1);
					assert.deepEqual(errSpy.args[0][0], transformError);
					assert.strictEqual(dataSpy.callCount, 3);
					assert.deepEqual(dataSpy.args[0][0], {key: 'A', value: 'Hello'});
					assert.deepEqual(dataSpy.args[2][0], {key: 'D', value: 'Day'});
					assert.strictEqual(finishSpy.callCount, 1);
					assert.strictEqual(endSpy.callCount, 1);
					assert.strictEqual(closeSpy.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20);
		})
	});
	
	describe("Promisifed", () => {
		
		describe("transform", () => {
			
			it("should use async transformer", async () => {
				// Transform stream that errors on the 2nd entry in our stream.
				const transform = new Transform<Buffer, string>({
					transform: (chunk, encoding) => {
						return new Promise((resolve) => {
							setTimeout(() =>
									resolve(`Transformed: ${chunk.toString()}`),
								10);
						});
					}
				});
				
				const errSpy = sinon.spy();
				const dataSpy = sinon.spy();
				const endSpy = sinon.spy();
				const finishSpy = sinon.spy();
				const closeSpy = sinon.spy();
				const pipeResult = input
					.pipe(transform)
					.on('error', errSpy)
					.on('data', dataSpy)
					.on('end', endSpy)
					.on('finish', finishSpy)
					.on('close', closeSpy);
				
				input.write('Part A');
				input.write('Part B');
				input.write('Part C');
				input.write('Part D');
				input.end();
				
				await pipeResult;
				assert.strictEqual(errSpy.callCount, 0);
				assert.strictEqual(dataSpy.callCount, 4);
				assert.strictEqual(dataSpy.args[0][0].toString(), 'Transformed: Part A');
				assert.strictEqual(dataSpy.args[3][0].toString(), 'Transformed: Part D');
				// End is weird here. Shouldn't really be listening to end anyway...
				assert.strictEqual(finishSpy.callCount, 1);
				assert.strictEqual(closeSpy.callCount, 0);
			});
			
			it("should be then-able", async () => {
				// Transform stream that errors on the 2nd entry in our stream.
				const transform = new Transform<Buffer, string>({
					transform: (chunk, encoding, callback) => {
						return callback(null, `Transformed: ${chunk.toString()}`);
					}
				});
				
				const errSpy = sinon.spy();
				const dataSpy = sinon.spy();
				const endSpy = sinon.spy();
				const finishSpy = sinon.spy();
				const closeSpy = sinon.spy();
				const pipeResult = input
					.pipe(transform)
					.on('error', errSpy)
					.on('data', dataSpy)
					.on('end', endSpy)
					.on('finish', finishSpy)
					.on('close', closeSpy);
				
				input.write('Part A');
				input.write('Part B');
				input.write('Part C');
				input.write('Part D');
				input.end();
				
				await pipeResult;
				assert.strictEqual(errSpy.callCount, 0);
				assert.strictEqual(dataSpy.callCount, 4);
				assert.strictEqual(dataSpy.args[0][0].toString(), 'Transformed: Part A');
				assert.strictEqual(dataSpy.args[3][0].toString(), 'Transformed: Part D');
				assert.strictEqual(finishSpy.callCount, 1);
				assert.strictEqual(endSpy.callCount, 1);
				assert.strictEqual(closeSpy.callCount, 0);
			});
			
			it("should be catch-able", async () => {
				// Transform stream that errors on the 2nd entry in our stream.
				let chunkCount = 0;
				const transformError = new Error(`Stream error!`);
				const transform = new Transform({
					transform: (chunk, encoding, callback) => {
						chunkCount++;
						if (chunkCount == 2) {
							return callback(transformError);
						}
						return callback(null, chunk);
					}
				});
				
				const errSpy = sinon.spy();
				const dataSpy = sinon.spy();
				const endSpy = sinon.spy();
				const finishSpy = sinon.spy();
				const closeSpy = sinon.spy();
				const pipeResult = input
					.pipe(transform)
					.on('error', errSpy)
					.on('data', dataSpy)
					.on('end', endSpy)
					.on('finish', finishSpy)
					.on('close', closeSpy);
				
				input.write('Part A');
				input.write('Part B');
				input.write('Part C');
				input.write('Part D');
				input.end('Part E');
				
				try {
					await pipeResult;
					throw new Error('Transform resolves in error should not hit then');
				}
				catch (err) {
					assert.strictEqual(dataSpy.callCount, 1);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(errSpy.callCount, 1);
					assert.strictEqual(errSpy.args[0][0].message, transformError.message);
					assert.strictEqual(err.message, transformError.message);
					assert.strictEqual(finishSpy.callCount, 0);
					assert.strictEqual(endSpy.callCount, 0);
					assert.strictEqual(closeSpy.callCount, 0);
				}
			});
			
			it("should be catch error in transform", async () => {
				// Transform stream that errors on the 2nd entry in our stream.
				let chunkCount = 0;
				const transformError = new Error(`Stream error!`);
				const transform = new Transform({
					transform: (chunk, encoding, callback) => {
						chunkCount++;
						if (chunkCount == 2) {
							throw transformError;
						}
						return callback(null, chunk);
					}
				});
				
				const errSpy = sinon.spy();
				const dataSpy = sinon.spy();
				const endSpy = sinon.spy();
				const finishSpy = sinon.spy();
				const closeSpy = sinon.spy();
				const pipeResult = input
					.pipe(transform)
					.on('error', errSpy)
					.on('data', dataSpy)
					.on('end', endSpy)
					.on('finish', finishSpy)
					.on('close', closeSpy);
				
				input.write('Part A');
				input.write('Part B');
				input.write('Part C');
				input.write('Part D');
				input.end('Part E');
				
				try {
					await pipeResult;
					throw new Error('Transform resolves in error should not hit then');
				}
				catch (err) {
					assert.strictEqual(dataSpy.callCount, 1);
					assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
					assert.strictEqual(errSpy.callCount, 1);
					assert.strictEqual(errSpy.args[0][0].message, transformError.message);
					assert.strictEqual(err.message, transformError.message);
					assert.strictEqual(finishSpy.callCount, 0);
					assert.strictEqual(endSpy.callCount, 0);
					assert.strictEqual(closeSpy.callCount, 0);
				}
			});
			
			it("should continue on error in object mode with a promise", async () => {
				input = new stream.PassThrough({
					readableObjectMode: true,
					writableObjectMode: true,
				});
				// Transform stream that errors on the 2nd entry in our stream.
				let chunkCount = 0;
				const transformError = new Error(`Stream error!`);
				const transform = new Transform({
					continueOnError: true,
					readableObjectMode: true,
					writableObjectMode: true,
					transform: (chunk, encoding, callback) => {
						chunkCount++;
						if (chunkCount == 2) {
							return callback(transformError);
						}
						return callback(null, chunk);
					}
				});
				
				const errSpy = sinon.spy();
				const dataSpy = sinon.spy();
				const endSpy = sinon.spy();
				const finishSpy = sinon.spy();
				const closeSpy = sinon.spy();
				const pipeResult = input
					.pipe(transform)
					.on('error', errSpy)
					.on('data', dataSpy)
					.on('end', endSpy)
					.on('finish', finishSpy)
					.on('close', closeSpy);
				
				input.write({key: 'A', value: 'Hello'});
				input.write({key: 'B', value: 'World'});
				input.write({key: 'C', value: 'Nice'});
				input.write({key: 'D', value: 'Day'});
				input.end();
				
				await pipeResult;
				
				assert.strictEqual(errSpy.callCount, 1);
				assert.deepEqual(errSpy.args[0][0], transformError);
				assert.strictEqual(dataSpy.callCount, 3);
				assert.deepEqual(dataSpy.args[0][0], {key: 'A', value: 'Hello'});
				assert.deepEqual(dataSpy.args[2][0], {key: 'D', value: 'Day'});
				assert.strictEqual(finishSpy.callCount, 1);
				assert.strictEqual(endSpy.callCount, 1);
				assert.strictEqual(closeSpy.callCount, 0);
			});
		});
		
		describe("flush", () =>  {
			it("should use a promisified flush", async() => {
				// Transform stream that errors on the 2nd entry in our stream.
				const transform = new Transform<Buffer, string>({
					transform: async (chunk, encoding) => {
						await wait(10);
						return `Transformed: ${chunk.toString()}`;
					},
					flush: async() => {
						await wait();
						return 'done!';
					}
				});
				
				const txeSpies = spyOnStream(transform);

				const pipeResult = input
					.pipe(transform);
				
				input.write('Part A');
				input.write('Part B');
				input.write('Part C');
				input.write('Part D');
				input.end();
				
				await pipeResult;
				assert.strictEqual(txeSpies.error.callCount, 0);
				assert.strictEqual(txeSpies.data.callCount, 5);
				assert.strictEqual(txeSpies.data.args[0][0].toString(), 'Transformed: Part A');
				assert.strictEqual(txeSpies.data.args[3][0].toString(), 'Transformed: Part D');
				assert.strictEqual(txeSpies.data.args[4][0].toString(), 'done!');
				// End is weird here. Shouldn't really be listening to end anyway...
				assert.strictEqual(txeSpies.finish.callCount, 1);
				assert.strictEqual(txeSpies.close.callCount, 0);
			});
		});
	});
	
	describe("Fork", () => {
		
		it("should fork into 2 streams before data is written", (done) => {
			
			// Transform stream that errors on the 2nd entry in our stream.
			const transform = new Transform<Buffer, string>({
				transform: (chunk, encoding) => {
					return new Promise((resolve) => {
						setTimeout(() =>
								resolve(`Transformed: ${chunk.toString()}`),
							1);
					});
				}
			});
			
			const receiver0 = new stream.PassThrough();
			const receiver1 = new stream.PassThrough();
			
			const originSpies = spyOnStream(transform);
			const receiver0Spies = spyOnStream(receiver0);
			const receiver1Spies = spyOnStream(receiver1);
			
			transform.fork(receiver0, receiver1);
			
			setTimeout(() => {
				try {
					assert.strictEqual(originSpies.error.callCount, 0);
					assert.strictEqual(originSpies.data.callCount, 4);
					assert.strictEqual(originSpies.data.args[0][0].toString(), 'Transformed: Part A');
					assert.strictEqual(originSpies.data.args[3][0].toString(), 'Transformed: Part D');
					assert.strictEqual(originSpies.end.callCount, 1);
					assert.strictEqual(originSpies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(originSpies.close.callCount, 0);
					
					assert.strictEqual(receiver0Spies.error.callCount, 0);
					assert.strictEqual(receiver0Spies.data.callCount, 4);
					assert.strictEqual(receiver0Spies.data.args[0][0].toString(), 'Transformed: Part A');
					assert.strictEqual(receiver0Spies.data.args[3][0].toString(), 'Transformed: Part D');
					assert.strictEqual(receiver0Spies.end.callCount, 1);
					assert.strictEqual(receiver0Spies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(receiver0Spies.close.callCount, 0);
					
					assert.strictEqual(receiver1Spies.error.callCount, 0);
					assert.strictEqual(receiver1Spies.data.callCount, 4);
					assert.strictEqual(receiver1Spies.data.args[0][0].toString(), 'Transformed: Part A');
					assert.strictEqual(receiver1Spies.data.args[3][0].toString(), 'Transformed: Part D');
					assert.strictEqual(receiver1Spies.end.callCount, 1);
					assert.strictEqual(receiver1Spies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(receiver1Spies.close.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
				
			}, 100);
			
			transform.write('Part A');
			transform.write('Part B');
			transform.write('Part C');
			transform.write('Part D');
			transform.end();
		});
		
		it("should fork into 2 streams after data is written", async () => {
			
			// Transform stream that errors on the 2nd entry in our stream.
			const transform = new Transform<Buffer, string>({
				transform: (chunk, encoding) => {
					return new Promise((resolve) => {
						setTimeout(() =>
								resolve(`Transformed: ${chunk.toString()}`),
							1);
					});
				}
			});
			
			const receiver0 = new stream.PassThrough();
			const receiver1 = new stream.PassThrough();
			
			const originSpies = spyOnStream(transform, {spyOnData: false});
			const receiver0Spies = spyOnStream(receiver0);
			const receiver1Spies = spyOnStream(receiver1);
			
			transform.write('Part A');
			transform.write('Part B');
			transform.write('Part C');
			transform.write('Part D');
			transform.end();
			
			await transform.fork(receiver0, receiver1);
			
			assert.strictEqual(originSpies.error.callCount, 0);
			assert.strictEqual(originSpies.end.callCount, 1);
			assert.strictEqual(originSpies.finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(originSpies.close.callCount, 0);
			
			assert.strictEqual(receiver0Spies.error.callCount, 0);
			assert.strictEqual(receiver0Spies.data.callCount, 4);
			assert.strictEqual(receiver0Spies.data.args[0][0].toString(), 'Transformed: Part A');
			assert.strictEqual(receiver0Spies.data.args[3][0].toString(), 'Transformed: Part D');
			assert.strictEqual(receiver0Spies.end.callCount, 1);
			assert.strictEqual(receiver0Spies.finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(receiver0Spies.close.callCount, 0);
			
			assert.strictEqual(receiver1Spies.error.callCount, 0);
			assert.strictEqual(receiver1Spies.data.callCount, 4);
			assert.strictEqual(receiver1Spies.data.args[0][0].toString(), 'Transformed: Part A');
			assert.strictEqual(receiver1Spies.data.args[3][0].toString(), 'Transformed: Part D');
			assert.strictEqual(receiver1Spies.end.callCount, 1);
			assert.strictEqual(receiver1Spies.finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(receiver1Spies.close.callCount, 0);
			
		});
		
		it("should fork into 2 other transforms after data is written", async () => {
			
			// Transform stream that errors on the 2nd entry in our stream.
			const transform = new Transform<Buffer, string>({
				transform: (chunk, encoding) => {
					return new Promise((resolve) => {
						setTimeout(() =>
								resolve(`Transformed: ${chunk.toString()}`),
							1);
					});
				}
			});
			
			const transformA = new Transform<Buffer, string>({
				transform: (chunk, encoding) => {
					return new Promise((resolve) => {
						setTimeout(() =>
								resolve(`TransformedA: ${chunk.toString()}`),
							1);
					});
				}
			});
			
			const transformB = new Transform<Buffer, string>({
				transform: (chunk, encoding) => {
					return new Promise((resolve) => {
						setTimeout(() =>
								resolve(`TransformedB: ${chunk.toString()}`),
							1);
					});
				}
			});
			
			const originSpies = spyOnStream(transform, {spyOnData: false});
			const receiver0Spies = spyOnStream(transformA);
			const receiver1Spies = spyOnStream(transformB);
			
			transform.write('Part A');
			transform.write('Part B');
			transform.write('Part C');
			transform.write('Part D');
			transform.end();
			
			await transform.fork(transformA, transformB);
			
			assert.strictEqual(originSpies.error.callCount, 0);
			assert.strictEqual(originSpies.end.callCount, 1);
			assert.strictEqual(originSpies.finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(originSpies.close.callCount, 0);
			
			assert.strictEqual(receiver0Spies.error.callCount, 0);
			assert.strictEqual(receiver0Spies.data.callCount, 4);
			assert.strictEqual(receiver0Spies.data.args[0][0].toString(), 'TransformedA: Transformed: Part A');
			assert.strictEqual(receiver0Spies.data.args[3][0].toString(), 'TransformedA: Transformed: Part D');
			assert.strictEqual(receiver0Spies.finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(receiver0Spies.close.callCount, 0);
			
			assert.strictEqual(receiver1Spies.error.callCount, 0);
			assert.strictEqual(receiver1Spies.data.callCount, 4);
			assert.strictEqual(receiver1Spies.data.args[0][0].toString(), 'TransformedB: Transformed: Part A');
			assert.strictEqual(receiver1Spies.data.args[3][0].toString(), 'TransformedB: Transformed: Part D');
			assert.strictEqual(receiver1Spies.finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(receiver1Spies.close.callCount, 0);
			
		});
		
	})
	
});