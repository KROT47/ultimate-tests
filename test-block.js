'use strict';

/* --------------------------------- Required Modules --------------------------------- */

const Extend = require( 'extend' );

const Helpers = require( './helpers' );


/* --------------------------------- Default Configs --------------------------------- */

const defaultTestBlockConfig = {
		testIndexes: {
			only: [],
			except: []
		},

		logs: {
			// 0 - only system messages ( default )
			// 1 - system + info messages
			// 2 - all messages
			level: 0,

			systemMessages: {

				/* ------------ config ------------- */

				types: {
					main: {
						level: 0,
						msgStart: '>>>>>>>>>>>>>>>>>>>>>>>>',
						msgEnd:   '<<<<<<<<<<<<<<<<<<<<<<<<',
						before() {},
						after() { if ( this.logs.level ) console.log() },
					},

					info: {
						level: 1,
						msgStart: '------------------------',
						msgEnd:   '------------------------',
						before() {},
						after() {},
					},

					other: {
						level: 2,
					}
				},


				/* ------------ main ------------- */

				start: {
					type: 'main',
					template: '{msgStart} Starting {testBlockName} ... {msgEnd}',
				},
				error: {
					type: 'main',
					template: '{msgStart} Error in {testBlockName} {msgEnd}\nTest index: {testIndex}\nTest error: {error}',
				},
				end: {
					type: 'main',
					template: '{msgStart} Ended {testBlockName}. All Good!!! {msgEnd}',
					after() {
						console.log();
						if ( this.logs.level ) console.log('\n\n');
					},
				},


				/* ------------ info ------------- */

				testStart: {
					type: 'info',
					template: '{msgStart} testing {testIndex} {msgEnd}',
				},

				testEnd: {
					type: 'info',
					template: '',
					after() { console.log() },
				},
			}
		}
	};

// any test file must export function that returns test block
const TestBlockConfig = {
		tests: [],

		// any other helpers
		// runHelper() {}
	};

// test is defined as object in TestBlock.tests array
const TestConfig = {
		/**
		 * Main test function
		 * Context: TestBlock
		 * @param (Number) testIndex - current test index
		 */
		test( testIndex ) {/*
			some test body;
			this.runHelper();  // from TestBlock
			this.tests[ testIndex ]; // current test
		*/},
	};


/* --------------------------------- TestBlock --------------------------------- */

class TestBlock {

	constructor( testBlockName, config, testBlockGetter ) {
		Extend( true, this, defaultTestBlockConfig, config );

		this.testBlockName = testBlockName;

		this._testBlock = testBlockGetter(
			assert,
			this._testLog.bind( this ),
			this._testError.bind( this )
		);
		this._testBlock = Extend( true, {}, TestBlockConfig, this._testBlock );
	}


	/* --------------------------------- Public --------------------------------- */

	/* ------------ Getters / Setters ------------- */

	/**
	 * Returns human test index
	 * @return (Number)
	 */
	get testIndex() { return this.index + 1 }


	/* ------------ Methods ------------- */

	/**
	 * Starts executing testBlock's tests
	 * @return (Promise)
	 */
	run() {
		this.index = -1;

		this._systemMessage( 'start' );

		return (
			this._run()
				.then( () => this._systemMessage( 'end' ) )
				.catch( error => error && this._systemMessage( 'error', { error } ) )
		);
	}


	/* --------------------------------- Private --------------------------------- */

	_run() {
		const tests = this._testBlock.tests;

		if ( this.index === tests.length - 1 ) return this._exit();

		if ( this.error ) {
			this._systemMessage( 'error', { error: this.error } );
			return this._exit( true );
		}

		if ( this._ignoreTest() ) {
			this.index++;
			return this._run();
		}

		this.index++;

		const testConfig = Extend( true, {}, TestConfig, tests[ this.index ] );

		this._systemMessage( 'testStart' );

		return (
			Promise.resolve( testConfig.test.call( this._testBlock, this.index ) )
				.then( () => {
					this._systemMessage( 'testEnd' );

					return this._run();
				})
		);
	}

	_ignoreTest() {
		const testIndexes = this.testIndexes;

		if ( testIndexes.only.length ) return !~testIndexes.only.indexOf( this.testIndex );

		if ( testIndexes.except.length && ~testIndexes.except.indexOf( this.testIndex ) ) {
			return true;
		}

		return false;
	}

	_systemMessage( msgName, data ) {
		const msg = this.logs.systemMessages[ msgName ];
		const msgConfig = Extend( true, {}, this.logs.systemMessages.types[ msg.type ], msg );

		this._systemLog(
			msgConfig,
			Helpers.resolveTemplate( msg.template, msgConfig, data, this )
		);
	}

	_systemLog( msgConfig ) {
		const args = Array.prototype.slice.call( arguments, 1 );

		this._log.apply( this, [ msgConfig ].concat( args ) );
	}

	_testLog() {
		const args = Array.prototype.slice.call( arguments );

		this._log.apply( this, [ this.logs.systemMessages.types.other ].concat( args ) );
	}

	_log( msgConfig ) {
		if ( this.logs.level < msgConfig.level ) return;

		msgConfig.before && msgConfig.before.call( this );

		log.apply( null, Array.prototype.slice.call( arguments, 1 ) );

		msgConfig.after && msgConfig.after.call( this );
	}


	_testError( err ) { this.error = err }

	_ignore( index, testName ) {
		if ( !this.testIndexes ) return false;

		if ( !Array.isArray( this.testIndexes ) ) this.testIndexes = [ this.testIndexes ];

		return !~this.testIndexes.indexOf( index );
	}

	_showLogs() {
		if ( !this.testIndexes && !this.forceLogs ) return;
		const args =
			Array.prototype.slice.call( arguments )
				.map( el => typeof el !== 'object' ? el : Helpers.print( el ) );

		console.log.apply( console, args );
	}

	_exit( force ) { return force ? Promise.reject() : Promise.resolve() }
};


/* --------------------------------- Module Exports --------------------------------- */

module.exports = TestBlock;


/* --------------------------------- Helpers --------------------------------- */

function assert() { console.assert.apply( console, arguments ) }

function log() {
	const args =
		Array.prototype.slice.call( arguments )
			.filter( el => el !== undefined )
			.map( el => typeof el !== 'object' ? el : Helpers.print( el ) );

	if ( !args.length ) return;

	console.log.apply( console, args );
}
