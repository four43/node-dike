import * as stream from "stream";
import * as sinon from "sinon";
import * as assert from "assert";
import enhance from "../../src/Stream/enhance";

let simplePassThrough: stream.PassThrough;

beforeEach(() => {
	simplePassThrough = new stream.PassThrough();
});

describe("enhance", () => {
	
	describe("Existing functionality", () => {
		it("should behave like plain stream sanity check", (done) => {
			// Read data from a stream
			const spies = spyOnStream(simplePassThrough);
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(spies.error.callCount, 0);
					assert.strictEqual(spies.data.callCount, 4);
					assert.strictEqual(spies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(spies.data.args[3][0].toString(), 'Part D');
					assert.strictEqual(spies.end.callCount, 1);
					assert.strictEqual(spies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(spies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(spies.finish.calledBefore(spies.end));
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should transform stream that throws an error", (done) => {
			// Plain NodeJS Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const txSpies = spyOnStream(transform)
			
			transform.write('Part A');
			transform.write('Part B');
			transform.write('Part C');
			transform.write('Part D');
			transform.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(txSpies.error.callCount, 1);
					assert.strictEqual(txSpies.data.callCount, 3);
					assert.strictEqual(txSpies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(txSpies.data.args[2][0].toString(), 'Part D');
					assert.strictEqual(txSpies.end.callCount, 1);
					assert.strictEqual(txSpies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(txSpies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(txSpies.finish.calledBefore(txSpies.end));
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should transform stream pipe that throws an error", (done) => {
			// Plain NodeJS Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const simpleSpies = spyOnStream(simplePassThrough);
			const txSpies = spyOnStream(transform);
			simplePassThrough
				.pipe(transform);
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(simpleSpies.error.callCount, 0);
					// Error caused the transform to be unpiped so this never finished on the read side?
					assert.strictEqual(simpleSpies.end.callCount, 0);
					assert.strictEqual(simpleSpies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(simpleSpies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(simpleSpies.finish.calledBefore(simpleSpies.end));
					
					assert.strictEqual(txSpies.error.callCount, 1);
					assert.strictEqual(txSpies.data.callCount, 1);
					assert.strictEqual(txSpies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(txSpies.end.callCount, 0);
					assert.strictEqual(txSpies.finish.callCount, 0);
					// Node docs are really vague on this one.
					assert.strictEqual(txSpies.close.callCount, 0);
					
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20);
		});
		
		it("should behave like a normal transform stream", (done) => {
			// Transform stream that errors on the 2nd entry in our stream.
			
			enhance(simplePassThrough);
			const simpleSpies = spyOnStream(simplePassThrough);
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			setTimeout(() => {
				try {
					assert.strictEqual(simpleSpies.error.callCount, 0);
					assert.strictEqual(simpleSpies.data.callCount, 4);
					assert.strictEqual(simpleSpies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(simpleSpies.data.args[3][0].toString(), 'Part D');
					assert.strictEqual(simpleSpies.end.callCount, 1);
					assert.strictEqual(simpleSpies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(simpleSpies.close.callCount, 0);
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
		
		it("should lose data when piping to multiple places async", (done) => {
			// Read data from a stream
			
			const output1 = new stream.PassThrough();
			const output2 = new stream.PassThrough();
			const output3 = new stream.PassThrough();
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			const simpleSpies = spyOnStream(simplePassThrough);
			const output1Spies = spyOnStream(output1);
			const output2Spies = spyOnStream(output2);
			const output3Spies = spyOnStream(output3);
			
			// Even if we explicitly pause...
			simplePassThrough.pause();
			simplePassThrough
				.pipe(output1);
			
			simplePassThrough
				.pipe(output2);
			
			// We loses data anything after the current tick, pipe starts flowing.
			setTimeout(() => {
				simplePassThrough
					.pipe(output3);
			}, 1);
			
			setTimeout(() => {
				try {
					assert.strictEqual(simpleSpies.error.callCount, 0);
					assert.strictEqual(simpleSpies.data.callCount, 4);
					assert.strictEqual(simpleSpies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(simpleSpies.data.args[3][0].toString(), 'Part D');
					assert.strictEqual(simpleSpies.end.callCount, 1);
					assert.strictEqual(simpleSpies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(simpleSpies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(simpleSpies.finish.calledBefore(simpleSpies.end));
					
					assert.strictEqual(output1Spies.error.callCount, 0);
					assert.strictEqual(output1Spies.data.callCount, 4);
					assert.strictEqual(output1Spies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(output1Spies.data.args[3][0].toString(), 'Part D');
					assert.strictEqual(output1Spies.end.callCount, 1);
					assert.strictEqual(output1Spies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(output1Spies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(output1Spies.finish.calledBefore(output1Spies.end));
					
					assert.strictEqual(output2Spies.error.callCount, 0);
					assert.strictEqual(output2Spies.data.callCount, 4);
					assert.strictEqual(output2Spies.data.args[0][0].toString(), 'Part A');
					assert.strictEqual(output2Spies.data.args[3][0].toString(), 'Part D');
					assert.strictEqual(output2Spies.end.callCount, 1);
					assert.strictEqual(output2Spies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(output2Spies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(output2Spies.finish.calledBefore(output2Spies.end));
					
					assert.strictEqual(output3Spies.error.callCount, 0);
					assert.strictEqual(output3Spies.data.callCount, 0);
					assert.strictEqual(output3Spies.end.callCount, 1);
					assert.strictEqual(output3Spies.finish.callCount, 1);
					// Node docs are really vague on this one.
					assert.strictEqual(output3Spies.close.callCount, 0);
					
					// Finish (writable side) -> "Transform" -> End (readable side)
					assert.ok(output3Spies.finish.calledBefore(output3Spies.end));
					
					done();
				}
				catch (err) {
					done(err);
				}
			}, 20)
		});
	});
	
	describe("Promisify", () => {
		
		it("should be then-able", async () => {
			// Transform stream that errors on the 2nd entry in our stream.
			
			enhance(simplePassThrough);
			
			const error = sinon.spy();
			const data = sinon.spy();
			const end = sinon.spy();
			const finish = sinon.spy();
			const close = sinon.spy();
			const inputDone = simplePassThrough
				.on('error', error)
				.on('data', data)
				.on('end', end)
				.on('finish', finish)
				.on('close', close);
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			await inputDone;
			
			assert.strictEqual(error.callCount, 0);
			assert.strictEqual(data.callCount, 4);
			assert.strictEqual(data.args[0][0].toString(), 'Part A');
			assert.strictEqual(data.args[3][0].toString(), 'Part D');
			assert.strictEqual(end.callCount, 1);
			assert.strictEqual(finish.callCount, 1);
			// Node docs are really vague on this one.
			assert.strictEqual(close.callCount, 0);
		});
		
		it("should be catch-able", async () => {
			
			// Plain NodeJS Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			enhance(transform);
			
			const error = sinon.spy();
			const data = sinon.spy();
			const end = sinon.spy();
			const finish = sinon.spy();
			const close = sinon.spy();
			const transformDone = transform
				.on('error', error)
				.on('data', data)
				.on('end', end)
				.on('finish', finish)
				.on('close', close);
			
			transform.write('Part A');
			transform.write('Part B');
			transform.write('Part C');
			transform.write('Part D');
			transform.end();
			
			try {
				await transformDone;
			}
			catch (err) {
				// NodeJS transform streams keep truckin on error
				assert.strictEqual(err.message, transformError.message);
				assert.strictEqual(error.callCount, 1);
				assert.strictEqual(data.callCount, 3);
				assert.strictEqual(data.args[0][0].toString(), 'Part A');
				assert.strictEqual(end.callCount, 1);
				assert.strictEqual(finish.callCount, 1);
				// Node docs are really vague on this one.
				assert.strictEqual(close.callCount, 0);
				
				// Finish (writable side) -> "Transform" -> End (readable side)
				assert.ok(finish.calledBefore(end));
			}
		});
		
		it("should be catch-able via pipe", async () => {
			// Plain NodeJS Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const txErrSpy = sinon.spy();
			const txDataSpy = sinon.spy();
			const txEndSpy = sinon.spy();
			const txFinishSpy = sinon.spy();
			const txCloseSpy = sinon.spy();
			
			const error = sinon.spy();
			const end = sinon.spy();
			const finish = sinon.spy();
			const close = sinon.spy();
			
			const pipeResult = simplePassThrough
				.on('error', error)
				.on('end', end)
				.on('finish', finish)
				.on('close', close)
				.pipe(transform)
				.on('error', txErrSpy)
				.on('data', txDataSpy)
				.on('end', txEndSpy)
				.on('finish', txFinishSpy)
				.on('close', txCloseSpy);
			
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			try {
				await pipeResult;
			}
			catch (err) {
				assert.strictEqual(error.callCount, 0);
				// Error caused the transform to be unpiped so this never finished on the read side.
				assert.strictEqual(end.callCount, 0);
				assert.strictEqual(finish.callCount, 1);
				// Node docs are really vague on this one.
				assert.strictEqual(close.callCount, 0);
				
				// Finish (writable side) -> "Transform" -> End (readable side)
				assert.ok(finish.calledBefore(end));
				
				assert.strictEqual(txErrSpy.callCount, 1);
				assert.strictEqual(txDataSpy.callCount, 1);
				assert.strictEqual(txDataSpy.args[0][0].toString(), 'Part A');
				assert.strictEqual(txEndSpy.callCount, 0);
				assert.strictEqual(txFinishSpy.callCount, 0);
				// Node docs are really vague on this one.
				assert.strictEqual(txCloseSpy.callCount, 0);
			}
		});
	});
	
	describe("Improved Error Handling", () => {
		
		it('should not plug back into writers (node default behavior)', async () => {
			
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const plainErroringTransform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const plainTransform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					return callback(null, chunk);
				}
			});
			
			const txeSpies = spyOnStream(plainErroringTransform);
			
			try {
				simplePassThrough.write('Part A');
				simplePassThrough.write('Part B');
				simplePassThrough.write('Part C');
				simplePassThrough.write('Part D');
				simplePassThrough.end();
				
				await simplePassThrough
					.pipe(enhance(plainErroringTransform))
			}
			catch (err) {
				assert.strictEqual(txeSpies.error.callCount, 1);
				assert.strictEqual(txeSpies.data.callCount, 1);
				assert.strictEqual(txeSpies.data.args[0][0].toString(), 'Part A');
				assert.strictEqual(txeSpies.end.callCount, 0);
				assert.strictEqual(txeSpies.finish.callCount, 0);
				// Node docs are really vague on this one.
				assert.strictEqual(txeSpies.close.callCount, 0);
			}
		});
		
		it('should plug back into writers when error handling is enabled', async () => {
			
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const plainErroringTransform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					chunkCount++;
					if (chunkCount == 2) {
						return callback(transformError);
					}
					return callback(null, chunk);
				}
			});
			
			const plainTransform = new stream.Transform({
				transform: (chunk: string, encoding, callback) => {
					return callback(null, chunk);
				}
			});
			
			const txeSpies = spyOnStream(plainErroringTransform);
			
			try {
				simplePassThrough.write('Part A');
				simplePassThrough.write('Part B');
				simplePassThrough.write('Part C');
				simplePassThrough.write('Part D');
				simplePassThrough.end();
				
				await simplePassThrough
					.pipe(enhance(plainErroringTransform, {continueOnError: true}))
			}
			catch (err) {
				assert.strictEqual(txeSpies.error.callCount, 1);
				assert.strictEqual(txeSpies.data.callCount, 3);
				assert.strictEqual(txeSpies.data.args[0][0].toString(), 'Part A');
				assert.strictEqual(txeSpies.data.args[1][0].toString(), 'Part C');
				assert.strictEqual(txeSpies.data.args[2][0].toString(), 'Part D');
				assert.strictEqual(txeSpies.end.callCount, 0);
				assert.strictEqual(txeSpies.finish.callCount, 0);
				// Node docs are really vague on this one.
				assert.strictEqual(txeSpies.close.callCount, 0);
			}
		});
		
	});
	
	describe("Promisifed", () => {
		it("should be then-able", async () => {
			// Transform stream that errors on the 2nd entry in our stream.
			enhance(simplePassThrough);
			
			const error = sinon.spy();
			const data = sinon.spy();
			const end = sinon.spy();
			const finish = sinon.spy();
			const close = sinon.spy();
			const streamResult = simplePassThrough
				.on('error', error)
				.on('data', data)
				.on('end', end)
				.on('finish', finish)
				.on('close', close);
			
			simplePassThrough.write('Part A');
			simplePassThrough.write('Part B');
			simplePassThrough.write('Part C');
			simplePassThrough.write('Part D');
			simplePassThrough.end();
			
			await streamResult;
			assert.strictEqual(error.callCount, 0);
			assert.strictEqual(data.callCount, 4);
			assert.strictEqual(data.args[0][0].toString(), 'Part A');
			assert.strictEqual(data.args[3][0].toString(), 'Part D');
			assert.strictEqual(finish.callCount, 1);
			assert.strictEqual(end.callCount, 1);
			assert.strictEqual(close.callCount, 0);
		});
		
		it("should be catch-able", async () => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			
			enhance(simplePassThrough);
			
			const error = sinon.spy();
			const data = sinon.spy();
			const end = sinon.spy();
			const finish = sinon.spy();
			const close = sinon.spy();
			const streamResult = simplePassThrough
				.on('error', error)
				.on('data', data)
				.on('end', end)
				.on('finish', finish)
				.on('close', close);
			
			simplePassThrough.write('Part A');
			// Mock the stream throwing an error
			simplePassThrough.emit('error', transformError);
			
			try {
				await streamResult;
				throw new Error('Transform resolves in error should not hit then');
			}
			catch (err) {
				assert.strictEqual(data.callCount, 1);
				assert.strictEqual(data.args[0][0].toString(), 'Part A');
				assert.strictEqual(error.callCount, 1);
				assert.strictEqual(error.args[0][0].message, transformError.message);
				assert.strictEqual(err.message, transformError.message);
				assert.strictEqual(finish.callCount, 0);
				assert.strictEqual(end.callCount, 0);
				assert.strictEqual(close.callCount, 0);
			}
		});
	});
});

function spyOnStream(stream: NodeJS.ReadableStream | NodeJS.WritableStream, options?: { spyOnData: boolean }) {
	options = {
		spyOnData: true,
		...options
	};
	
	const spies = {
		error: sinon.spy(),
		data: sinon.spy(),
		end: sinon.spy(),
		finish: sinon.spy(),
		close: sinon.spy()
	};
	
	stream.on('error', spies.error)
		.on('data', spies.data)
		.on('end', spies.end)
		.on('finish', spies.finish)
		.on('close', spies.close);
	
	return spies;
}