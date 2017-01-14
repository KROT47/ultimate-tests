
/* --------------------------------- Required Modules --------------------------------- */

const Extend = require( 'extend' );

/* --------------------------------- Module Exports --------------------------------- */

module.exports = {

	valueOf,

	print,

	newObject,

	replaceComplexObjectsWithStrings,

	resolveTemplate,

	getData,

	ignore,
};


/* --------------------------------- Helpers --------------------------------- */

/**
 * Returns value of obj if possible
 * @param (Mixed) obj
 * @return (Mixed)
 */
function valueOf( obj ) { return obj && typeof obj.valueOf === 'function' && obj.valueOf() || obj }

/**
 * Extends all properties
 * @param (Object|Array) obj
 * @param (Boolean) copyHiddenProps - if true - non enumerable props will be copied too
 * @return (Object|Array)
 */
function deepExtendAll( target/*, options1, ...*/ ) {
	var props, i, k, value;

	for ( i = 1; i < arguments.length; ++i ) {
		props = Object.getOwnPropertyNames( arguments[ i ] );

		for ( k = props.length; k--; ) {
			value = arguments[ i ][ props[ k ] ];

			if ( value && typeof value === 'object' ) {
				target[ props[ k ] ] = deepExtendAll( newObject( value ), value );
			} else {
				target[ props[ k ] ] = value;
			}
		}
	}

	return target;
}

/**
 * Prints anything correctly
 * @param (Mixed) obj
 * @return (String)
 */
// function print( obj ) {
//     var toPrint = valueOf( obj );

//     if ( toPrint && typeof toPrint === 'object' ) {
//         toPrint = deepExtendAll( newObject( toPrint ), toPrint );

//         toPrint = replaceComplexObjectsWithStrings( toPrint );
//     }

//     return (
//         JSON.stringify( toPrint )
//             .replace( /"(\w)/g, ' $1' )
//             .replace( /"(.)/g, '$1' )
//             .replace( /:(.)/g, ': $1' )
//             .replace( /\}/g, ' }' )
//     );
// }
function print( obj, showHiddenProps ) {
	var toPrint = valueOf( obj );

	if ( toPrint && typeof toPrint === 'object' ) {
		toPrint = deepExtendAll( newObject( toPrint ), toPrint );

		toPrint = replaceComplexObjectsWithStrings( toPrint );
	}

	return _print( toPrint, showHiddenProps );
}
function _print( obj, showHiddenProps ) {
	if ( !obj ) return obj;

	if ( typeof obj !== 'object' ) return obj.toString();

	const arr = [];
	var i, template;

	if ( Array.isArray( obj ) ) {

		for ( i = 0; i < obj.length; ++i ) {
			if ( typeof obj[ i ] === 'object' ) {
				arr.push( _print( obj[ i ], showHiddenProps ) );
			} else {
				arr.push( obj[ i ] );
			}
		}

		template = '[ printedObj ]';

	} else {
		const props = [];

		for ( i in obj ) props.push( i );

		props.sort();

		for ( i = 0; i < props.length; ++i ) {
			if ( typeof obj[ props[ i ] ] === 'object' ) {
				arr.push( `${props[ i ]}: ${_print( obj[ props[ i ] ], showHiddenProps )}` );
			} else {
				arr.push( `${props[ i ]}: ${obj[ props[ i ] ]}` );
			}
		}

		template = '{ printedObj }';
	}

	const printedObj = arr.join( ', ' );

	return template.replace( 'printedObj', printedObj );
}

// returns empty array or object due to obj type
function newObject( obj ) { return Array.isArray( obj ) ? [] : {} }

/**
 * Replace function to string '[Function]'
 * @param (Object|Array) obj
 */
function replaceComplexObjectsWithStrings( obj ) {
	for ( var i in obj ) {
		if ( obj[ i ] instanceof Promise ) {
			obj[ i ] = '[Promise]';
			continue;
		}

		switch ( typeof obj[ i ] ) {
			case 'object':
				obj[ i ] = valueOf( obj[ i ] );
				obj[ i ] = replaceComplexObjectsWithStrings( obj[ i ] );
			break;

			case 'function': obj[ i ] = '[Function]';
			// case 'function': obj[ i ] = obj[ i ].toString();
			break;
		}
	}

	return obj;
}

/**
 * Returns resolved template string using one or more data objects
 * @param (String) template
 * @param (Object) ...data
 * @return (String)
 */
function resolveTemplate( template/*, ...data*/ ) {
	if ( !template ) return;

	const dataObjects = Array.prototype.slice.call( arguments, 1 );

	return template.replace( /\{(.+?)\}/g, ( match, p1 ) => {
		return getData( dataObjects, p1, match );
	});
}

/**
 * Returns first value from dataObjects by key or default value
 * @param (Array|Object) dataObjects
 * @param (String|Number) key
 * @param (Mixed) defaultValue
 * @return (Mixed)
 */
function getData( dataObjects, key, defaultValue ) {
	if ( Array.isArray( dataObjects ) ) {
		for ( var result, i = 0; i < dataObjects.length; ++i ) {
			result = getData( dataObjects[ i ], key, defaultValue );
			if ( result !== defaultValue ) return result;
		}

		return defaultValue;
	}

	if ( !dataObjects || dataObjects[ key ] === undefined ) return defaultValue;

	var value = dataObjects[ key ];

	if ( value instanceof Error ) value = value + value.stack;

	return value;
}

/**
 * Tells if some test should be ignored
 * @param (Object) config
 * @param (String|Number) key
 * @return (Mixed)
 */
function ignore( config, key ) {
	if ( config.only.length ) return !~config.only.indexOf( key );

	if ( config.except.length && ~config.except.indexOf( key ) ) return true;

	return false;
}
