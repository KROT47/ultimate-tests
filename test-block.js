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

		this._testBlock = testBlockGetter({
			assert: 		assert,
			log: 			this._testLog.bind( this ),
			error: 			this._testError.bind( this ),
			expectError: 	this._testExpectError.bind( this ),
		});
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

		this.index++;

		if ( this._ignoreTest() ) return this._run();

		const testConfig = Extend( true, {}, TestConfig, tests[ this.index ] );

		this._systemMessage( 'testStart' );


		return (
			new Promise( ( resolve, reject ) => {
				try {
					resolve( testConfig.test.call( this._testBlock, this.index ) );
				} catch ( e ) {
					reject( e );
				}
			})
				.then( () => {
					if ( this.error ) {
						this._systemMessage( 'error', { error: this.error } );
						return this._exit( true );
					}

					this._systemMessage( 'testEnd' );

					return this._run();
				})
		);
	}

	_ignoreTest() { return Helpers.ignore( this.testIndexes, this.testIndex ) }

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

		arguments[ 0 ] = msgConfig.level > 2;

		log.apply( null, Array.prototype.slice.call( arguments ) );

		msgConfig.after && msgConfig.after.call( this );
	}


	_testError( err ) { this.error = err }

	_testExpectError( msg, func ) {
		var error;

		try {
			func();
		} catch ( e ) {
			error = e;
		}

		if ( !error ) this._testError( msg );
	}

	_ignore( index, testName ) {
		if ( !this.testIndexes ) return false;

		if ( !Array.isArray( this.testIndexes ) ) this.testIndexes = [ this.testIndexes ];

		return !~this.testIndexes.indexOf( index );
	}

	// _showLogs() {
	// 	if ( !this.testIndexes && !this.forceLogs ) return;
	// 	const args =
	// 		Array.prototype.slice.call( arguments )
	// 			.map( el => typeof el !== 'object' ? el : Helpers.print( el ) );

	// 	console.log.apply( console, args );
	// }

	_exit( force ) { return force ? Promise.reject() : Promise.resolve() }
};


/* --------------------------------- Module Exports --------------------------------- */

module.exports = TestBlock;


/* --------------------------------- Helpers --------------------------------- */

function assert() { console.assert.apply( console, arguments ) }

function log( showHiddenProps ) {
	const args =
		Array.prototype.slice.call( arguments, 1 )
			.filter( el => el !== undefined )
			.map( el => typeof el !== 'object' ? el : Helpers.print( el, showHiddenProps ) );

	if ( !args.length ) return;

	console.log.apply( console, args );
}
