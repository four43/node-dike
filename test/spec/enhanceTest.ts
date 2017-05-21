import * as stream from "stream";
import * as sinon from "sinon";
import * as assert from "assert";
import enhance from "../../src/Stream/enhance";

let input: stream.PassThrough;

beforeEach(() => {
	input = new stream.PassThrough();
});

describe("enhance", () => {
	
	describe("Existing functionality", () => {
		it("should transform stream sanity check", (done) => {
			// Read data from a stream
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
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
			
			enhance(input);
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			input
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
	})
	
	describe("Promisifed", () => {
		it("should be then-able", async () => {
			// Transform stream that errors on the 2nd entry in our stream.
			enhance(input);
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			const streamResult = input
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
			
			await streamResult;
			assert.strictEqual(errSpy.callCount, 0);
			assert.strictEqual(dataSpy.callCount, 4);
			assert.strictEqual(dataSpy.args[0][0].toString(), 'Part A');
			assert.strictEqual(dataSpy.args[3][0].toString(), 'Part D');
			assert.strictEqual(finishSpy.callCount, 1);
			assert.strictEqual(endSpy.callCount, 1);
			assert.strictEqual(closeSpy.callCount, 0);
		});
		
		it("should be catch-able", async () => {
			// Transform stream that errors on the 2nd entry in our stream.
			let chunkCount = 0;
			const transformError = new Error(`Stream error!`);
			
			enhance(input);
			
			const errSpy = sinon.spy();
			const dataSpy = sinon.spy();
			const endSpy = sinon.spy();
			const finishSpy = sinon.spy();
			const closeSpy = sinon.spy();
			const streamResult = input
				.on('error', errSpy)
				.on('data', dataSpy)
				.on('end', endSpy)
				.on('finish', finishSpy)
				.on('close', closeSpy);
			
			input.write('Part A');
			// Mock the stream throwing an error
			input.emit('error', transformError);
			
			try {
				await streamResult;
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
	});
})