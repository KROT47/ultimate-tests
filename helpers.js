
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
};


/* --------------------------------- Helpers --------------------------------- */

/**
 * Returns value of obj if possible
 * @param (Mixed) obj
 * @return (Mixed)
 */
function valueOf( obj ) { return obj && typeof obj.valueOf === 'function' && obj.valueOf() || obj }

/**
 * Prints anything correctly
 * @param (Mixed) obj
 * @return (String)
 */
function print( obj ) {
    obj = replaceComplexObjectsWithStrings( valueOf( obj ) );

    return (
        JSON.stringify( obj )
            .replace( /"(\w)/g, ' $1' )
            .replace( /"(.)/g, '$1' )
            .replace( /:(.)/g, ': $1' )
            .replace( /\}/g, ' }' )
    );
}

// returns empty array or object due to obj type
function newObject( obj ) { return Array.isArray( obj ) ? [] : {} }

/**
 * Replace function to string '[Function]'
 * @param (Object|Array) obj
 */
function replaceComplexObjectsWithStrings( obj ) {
	obj = Extend( true, newObject( obj ), obj );

    for ( var i in obj ) {
    	if ( obj[ i ] instanceof Promise ) {
    		obj[ i ] = '[Promise]';
    		continue;
    	}

        switch ( typeof obj[ i ] ) {
            case 'object': obj[ i ] = replaceComplexObjectsWithStrings( obj[ i ] );
            break;

            case 'function': obj[ i ] = '[Function]';
            // case 'function': obj[ i ] = obj[ i ].toString();
            break;
        }
    }

    return obj;
}

function resolveTemplate( template/*, ...data*/ ) {
	if ( !template ) return;

    const dataObjects = Array.prototype.slice.call( arguments, 1 );

    return template.replace( /\{(.+?)\}/g, ( match, p1 ) => {
        return getData( dataObjects, p1, match );
    });
}

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
