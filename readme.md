# UltimateTests

Provides flexible tests environment.

**Usage example:**

File: **test.js**
```js
const Tests = require( 'ultimate-tests' );

/* --------------------------------- Tests --------------------------------- */

new Tests({
	testsDir: './tests',    // default './'
    
    // default config for each testBlock
    // each testBlock can override this ( see below )
	defaultConfig: {
	    // defines which tests to run
	    testIndexes: {/* see below */},
        
		logs: {
		    // 0 - only system messages ( default )
            // 1 - system + info messages
            // 2 - all messages
			level: 0,
			
			// advanced
			systemMessages: {/* see test-block.js  */}
		}
	},

	tests: {
		TestsBlock1: {
			file: 'tests-block-1',

			testIndexes: {
				only: [1,2,3],   // which tests will be executed by index
				except: []   // which tests will be omitted by index
			},
		},
	}
});
```

File: **./tests/tests-block-1.js**
```js
/**
 * Module must return function
 * @param (Function) assert( condition, errorMsg ) - is used to check test results
 * @param (Function) log( ...msg ) - is used to print some data
 * @param (Function) error( msg ) - is used to immediately throw error
 */
module.exports = ( assert, log, error ) => ({
    // Array of all tests ( required )
	tests: [{
		/* ------------ 1 ------------- */

		test( testIndex ) {
			// ... some test body ...
            // this.tests[ testIndex ]; // current test

			this.someHelper();
			
			log( 'a:', a );     // prints message if log.level >= 2
			log( 'b:', b );
			
			assert( a === b, 'something is wrong' );    // throws error if a !== b
			
			if ( a.x !== b.x ) error( 'this can not be' );  // throws error
			
			return Promise.resolve( testResult );  // if test might return Promise
		}
	}],

	someHelper() {},
});
```
