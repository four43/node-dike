import * as stream from "stream";
import Transform from "../../src/Transform";
import * as sinon from "sinon";
import * as assert from "assert";

let input: stream.PassThrough;

beforeEach(() => {
	input = new stream.PassThrough();
});

describe("Transform", () => {
	
	describe("Existing functionality", () => {
		
		it("should behave like a normal transform stream", () => {
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
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy);
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end('Part E');
			
			setTimeout(() => {
				assert.equal(dataSpy.callCount, 1);
				assert.equal(dataSpy.args[0], 'Part A');
				assert.equal(errSpy.callCount, 1);
				assert.equal(errSpy.args[0], transformError);
			}, 20)
		});
		
		it("should behave like a normal transform in object mode", () => {
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
			input.end({key: 'E', value: 'Today'});
			
			setTimeout(() => {
				assert.equal(dataSpy.callCount, 1);
				assert.deepEqual(dataSpy.args[0], {key: 'A', value: 'Hello'});
				assert.equal(errSpy.callCount, 1);
				assert.deepEqual(errSpy.args[0], transformError);
			}, 20)
		})
		
	})
	
	describe("stopOnError Option", () => {
		
		it("should continue on error", () => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			const transform = new Transform({
				continueOnError: true,
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
			
			input.write('Part A');
			input.write('Part B');
			input.write('Part C');
			input.write('Part D');
			input.end('Part E');
			
			setTimeout(() => {
				assert.equal(dataSpy.callCount, 5);
				assert.equal(dataSpy.args[0], 'Part A');
				assert.equal(dataSpy.args[4], 'Part E');
				assert.equal(errSpy.callCount, 1);
				assert.equal(errSpy.args[0], transformError);
			}, 20)
		});
		
		it("should continue on error in object mode", () => {
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
			input
				.pipe(transform)
				.on('error', errSpy)
				.on('data', dataSpy);
			
			input.write({key: 'A', value: 'Hello'});
			input.write({key: 'B', value: 'World'});
			input.write({key: 'C', value: 'Nice'});
			input.write({key: 'D', value: 'Day'});
			input.end({key: 'E', value: 'Today'});
			
			setTimeout(() => {
				assert.equal(dataSpy.callCount, 1);
				assert.deepEqual(dataSpy.args[0], {key: 'A', value: 'Hello'});
				assert.equal(errSpy.callCount, 1);
				assert.deepEqual(errSpy.args[0], transformError);
			}, 20)
		})
	})
	
});