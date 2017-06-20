import * as stream from "stream";
import {Deferred} from "ts-deferred";

/**
 * Transform
 *
 * A drop in replacement for stream.Transform
 *
 * * continueOnError option that allow the stream to keep flowing through a pipe after an error is emitted.
 * * Promisified has promise methods so you can directly attach to a stream and handle done states in a chain.
 */
export default class Transform<T, U> extends stream.Transform implements Promise<undefined> {
	
	[Symbol.toStringTag]: 'Promise';
	private source: NodeJS.ReadableStream;
	
	private result: Deferred<undefined>;
	private errored: false | Error = false;
	private finished: boolean = false;
	private flushed: boolean = false;
	
	constructor(public options?: ITransformOptions<T, U>) {
		super({
			...options,
			transform: (chunk, encoding, callback) => {
					try {
						const transformResult = options.transform(
							chunk as any as T,
							encoding,
							(err, result) => {
								if (err) {
									if (options.continueOnError) {
										// Running callback(err) destroys input buffers and we can't recover.
										this.emit('error', err);
										callback();
									}
									else {
										callback(err)
									}
								}
								else {
									callback(null, result);
								}
							});
						if (transformResult instanceof Promise) {
							transformResult
								.then((result) => {
									callback(null, result);
								})
								.catch((err) => {
									if (options.continueOnError) {
										// Running callback(err) destroys input buffers and we can't recover.
										this.emit('error', err);
										callback();
									}
									else {
										callback(err);
									}
								});
						}
					}
					catch (err) {
						callback(err);
					}
			},
			flush: (callback) => {
				try {
					if(options.flush) {
						const flushResult = options.flush(
							(err, result) => {
								if (err) {
									if (options.continueOnError) {
										// Running callback(err) destroys input buffers and we can't recover.
										this.emit('error', err);
										callback();
									}
									else {
										callback(err)
									}
								}
								else {
									this.push(result);
									callback();
								}
								this.flushDone();
							});
						if (flushResult instanceof Promise) {
							flushResult
								.then((result) => {
									this.push(result);
									callback();
									this.flushDone();
								})
								.catch((err) => {
									if (options.continueOnError) {
										// Running callback(err) destroys input buffers and we can't recover.
										this.emit('error', err);
										callback();
									}
									else {
										callback(err);
									}
									this.flushDone();
								});
						}
					}
					else {
						// No flush handler registered, just run callback.
						callback();
						this.flushed = true;
					}
				}
				catch (err) {
					callback(err);
					this.flushDone();
				}
			}
		});
		
		// Set these up right away in case our .then, .catch is after our stream is already done.
		this.on('error', (err) => {
			this.errored = err;
		});
		
		this.on('finish', () => {
			this.finished = true;
		});
		
		// Re-pipe error handling, this.emit('error', ...) still unpipes us.
		if (options.continueOnError) {
			this.on('pipe', (source: NodeJS.ReadableStream) => {
				// Something was piped to us
				this.source = source;
			});
			
			this.on('error', () => {
				if (this.source) {
					this.source.pipe(this);
				}
			});
		}
	}
	
	emit(event:string, ...args: any[]): boolean {
		console.log(`Event: ${event}, finished: ${this.finished}, flushed: ${this.flushed}`);
		if(event === 'finish' && this.flushed === false) {
			// Wait for things to finish
			return false;
		}
		else {
			return super.emit(event, ...args);
		}
	}
	
	
	then(onfulfilled?: ((value: undefined) => undefined | Promise<undefined>) | undefined | null,
	     onrejected?: ((reason: any) => U | PromiseLike<U>) | undefined | null): Promise<undefined> {
		
		this.setupPromise();
		
		return this.result.promise.then(onfulfilled, onrejected);
	}
	
	catch(onrejected?: ((reason: any) => undefined | Promise<undefined>) | undefined | null): Promise<undefined> {
		
		this.setupPromise();
		
		return this.result.promise.catch(onrejected);
	}
	
	fork(...writableStreams:NodeJS.WritableStream[]) {
		const wasPaused = this.isPaused();
		this.pause();
		writableStreams.forEach(writableStream => this.pipe(writableStream));
		if(!wasPaused) {
			this.resume();
		}
	}
	
	private setupPromise() {
		if (!this.result) {
			this.result = new Deferred<undefined>();
			
			// Promise handlers
			if (this.finished && (!this.errored || this.options.continueOnError)) {
				this.result.resolve();
			}
			else {
				this.on('finish', this.result.resolve);
			}
			
			if (this.errored) {
				if (!this.options.continueOnError) {
					this.result.reject(this.errored);
				}
			}
			else {
				if (!this.options.continueOnError) {
					this.on('error', this.result.reject);
				}
			}
		}
	}
	
	private flushDone() {
		this.flushed = true;
		this.emit('finish');
	}
}

export interface ITransformOptions<T, U> extends stream.TransformOptions {
	continueOnError?: boolean,
	transform: (chunk: T | string | Buffer, encoding: string, callback?: (error: Error | null, result?: U) => void) => Promise<U> | void;
	flush?: (callback?: (error: Error | null, result?: U) => void) => Promise<U> | void;
}