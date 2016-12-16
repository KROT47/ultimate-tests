
/* --------------------------------- Required Modules --------------------------------- */

const Path = require( 'path' );

const Extend = require( 'extend' );

const TestBlock = require( './test-block' );

require( 'babel-register' );


/* --------------------------------- DefaultConfig --------------------------------- */

const DefaultConfig = {
		rootDir: process.cwd(),

		testsDir: './',

		defaultConfig: {},

		tests: {
			// testName: {
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
		const testBlockConfig = config.tests[ name ];
		const testConfig = Extend( true, {}, config.defaultConfig, testBlockConfig );
		const testsDir = Path.resolve( config.rootDir, config.testsDir )

		const testBlock = require( Path.resolve( testsDir, testBlockConfig.file ) );

		( new TestBlock( name, testConfig, testBlock ) )
			.run()
			.then( () => this.run() );
	}
}


/* --------------------------------- Module Exports --------------------------------- */

module.exports = UltimateTests;
