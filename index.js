
/* --------------------------------- Required Modules --------------------------------- */

const Path = require( 'path' );

const Extend = require( 'extend' );

const TestBlock = require( './test-block' );

const Helpers = require( './helpers' );

require( 'babel-register' );


/* --------------------------------- DefaultConfig --------------------------------- */

const DefaultConfig = {
		rootDir: process.cwd(),

		testsDir: './',

		// default config for each testBlock
		defaultConfig: {},

		// defines which testBlocks to run by names
		testNames: {
			only: [],
			except: [],
		},

		tests: {
			// tesBlocktName: {
			// 	file: 'fileName',

			//  @TestBlockConfig
			// },
		}
	};


/* --------------------------------- UltimateTests --------------------------------- */

class UltimateTests {

	constructor( config ) {
		this._config = Extend( true, {}, DefaultConfig, config );

		this._testKeys = Object.keys( this._config.tests );

        this.index = 0;

        this._checkForOnlyExcept();

		this.run();
	}


	/* --------------------------------- Public --------------------------------- */

	/**
	 * Runs all tests
	 */
	run() {
		if ( this.index === this._testKeys.length ) return;

		const config = this._config;
		const name = this._testKeys[ this.index++ ];

		if ( this._ignoreTestBlock( name ) ) return this.run();

		const testBlockConfig = config.tests[ name ];
		const testConfig = Extend( true, {}, config.defaultConfig, testBlockConfig );
		const testsDir = Path.resolve( config.rootDir, config.testsDir )

		const testBlock = require( Path.resolve( testsDir, testBlockConfig.file ) );

		( new TestBlock( name, testConfig, testBlock ) )
			.run()
			.then( () => this.run() );
	}


	/* --------------------------------- Private --------------------------------- */

    _checkForOnlyExcept() {
    	const testNames = this._config.testNames;

    	if ( testNames.only.length ) {
    		this._log( `Executing only '${testNames.only.join( `', '` )}' test block${testNames.only.length > 1 ? 's' : ''}` );
    		return;
    	}

    	if ( testNames.except.length ) {
    		this._log( `Executing all test blocks except '${testNames.except.join( `', '` )}'` );
    	}
    }

    _log() {
    	const args = Array.prototype.slice.call( arguments );
    	const str = '!!!!!!!!!!!!!!!!!!!!!!!!!!!';

    	args.unshift( str );
    	args.push( str );

    	console.log();
    	console.log.apply( console, args );
    	console.log();
    }

	_ignoreTestBlock( name ) { return Helpers.ignore( this._config.testNames, name ) }
}


/* --------------------------------- Module Exports --------------------------------- */

module.exports = UltimateTests;
