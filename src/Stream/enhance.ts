import {Deferred} from "ts-deferred";

/**
 * Wrap an existing readable stream in our extra features.
 * @param stream
 * @returns {{then: (()), catch: (())}}
 */
function enhance<T>(stream: NodeJS.ReadableStream, options?: IEnhanceOptions): IStreamPromise {
	
	options = {
		...options
	};
	
	let result: Deferred<undefined>;
	let errored: false | Error = false;
	let finished: boolean = false;
	
	function setupPromise() {
		if (!result) {
			result = new Deferred<undefined>();
			
			// Promise handlers
			if (finished && (!errored || options.continueOnError)) {
				result.resolve();
			}
			else {
				stream.on('finish', result.resolve);
			}
			
			if (errored) {
				if (!options.continueOnError) {
					result.reject(errored);
				}
			}
			else {
				if (!options.continueOnError) {
					stream.on('error', result.reject);
				}
			}
		}
	}
	
	// Set these up right away in case our .then, .catch is after our stream is already done.
	stream.on('error', (err: Error) => {
		errored = err;
	});
	
	stream.on('finish', () => {
		finished = true;
	});
	
	// Re-pipe error handling
	if (options.continueOnError) {
		// @todo - See what we have to do from a reading standpoint here.
	}
	
	const enhancedStream: IStreamPromise = stream as any as IStreamPromise;
	
	enhancedStream.then = function (onfulfilled?: ((value: undefined) => undefined | Promise<undefined>) | undefined | null,
	                                onrejected?: ((reason: any) => T | PromiseLike<T>) | undefined | null): Promise<undefined> {
		
		setupPromise();
		
		return result.promise.then(onfulfilled, onrejected);
	};
	
	enhancedStream.catch = function (onrejected?: ((reason: any) => undefined | Promise<undefined>) | undefined | null): Promise<undefined> {
		
		setupPromise();
		
		return result.promise.catch(onrejected);
	};
	
	return enhancedStream;
}

export interface IEnhanceOptions {
	continueOnError?: boolean
}

export interface IStreamPromise extends NodeJS.ReadableStream, Promise<undefined> {
}

export default enhance;