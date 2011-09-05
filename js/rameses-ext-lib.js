/***
    version 1.5.25.22
    Rameses javascript extension library
**/

//******************************************************************************************************************
// String extensions
//******************************************************************************************************************
String.prototype.trim = function(){ return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""))};
String.prototype.startsWith = function(str) {return (this.match("^"+str)==str)};
String.prototype.endsWith = function(str) {return (this.match(str+"$")==str)};

//******************************************************************************************************************
// Array extensions
//******************************************************************************************************************
Array.prototype.remove = function( from, to ) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
};
Array.prototype.removeAll = function( func ) {
	var _retained = [];
	var _removed = [];
	for( var i=0; i<this.length; i++ ) {
		var item = this[i];
		if( !func(item) == true ) {
			_retained.push( item );
		}
		else {
			_removed.push( item );
		}
	}
	this.length = 0;
	this.push.apply(this, _retained);
	return _removed;
};
Array.prototype.addAll = function( list ) {
	for( var i=0; i<list.length; i++ ) {
		this.push( list[i] );
	}
	return this;
};
Array.prototype.each = function( func ) {
	for( var i=0; i<this.length; i++ ) {
		func( this[i], i );
	}
	return this;
};
Array.prototype.find = function( func) {
	if( $.isFunction(func) ) {
		for( var i=0; i<this.length; i++ ) {
			var item = this[i];
			if( func(item) == true ) {
				return item;
			}
		}
		return null;
	}
	else {
		alert("Please pass a function when using find" );
	}
};
Array.prototype.contains = function( func) {
	if( $.isFunction(func) ) {
		for( var i=0; i<this.length; i++ ) {
			var item = this[i];
			if( func(item) == true ) {
				return true;
			}
		}
		return false;
	}
	else {
		alert("Please pass a function when using find" );
	}
};
Array.prototype.findAll = function( func ) {
	if( $.isFunction(func) ) {
		var _arr = [];
		for( var i=0; i<this.length; i++ ) {
			var item = this[i];
			if( func(item) == true ) {
				_arr.push(item);
			}
		}
		return _arr;
	}
	else {
		alert("Please pass a function when using findAll" );
	}
};
Array.prototype.collect = function( func ) {
	if( $.isFunction(func) ) {
		var _arr = [];
		for( var i=0; i<this.length; i++ ) {
			var item = this[i];
			var o = func(item);
			if(o!=null) _arr.push(o);
		}
		return _arr;
	}
	else {
		alert("Please pass a function when using collect" );
	}
};



/**
 * string expression support
 * @param ctx
 *          - the context of the expression (window is the default context)
 *          - the context can be a function that handles the variable resolution of an expression
 * usage: "hello ${name}".evaluate( [optional context] );
 *        - where name is a property of the context
 *
 * @author jaycverg
 */
String.prototype.evaluate = function( ctx ) {

    ctx = ctx? ctx : window;
    var handler = (typeof ctx === 'function')? ctx : defaultHandler;

    var str = this, match;
    while( (match = str.match(/(?:\$|#){([^{]+)}/)) ) {
        str = str.replace( match[0], _evaluate(match[1]) );
    }    
    return str+''; //return the parsed value

    //-- helper methods
    function defaultHandler(name) {
        return BeanUtils.getProperty( ctx, name );
    }

    function _evaluate(str) {
        var match = str.match(/[a-zA-Z_\$]+[\w\.]*(?:\([^\)]*\))?|'[^']*'|"[^"]*"/g);
        for(var i=0; i<match.length; ++i) {
            var o = '';
            if( match[i].charAt(0) === "'" || match[i].charAt(0) === '"' ) {
                o = match[i];
            }
            else {
                try {
                    o = handler( match[i] );
                }catch(e) {
                    if( window.console ) window.console.log( e.message );
                }
                if( typeof o === 'number' || typeof o === 'boolean' ); //do nothing
                else if( typeof o === 'string' )
                    o = "'" + strEscape(o) + "'";
                else if ( o == null || typeof o === 'undefined' )
                    o = 'null';
                else
                    o = "'[object]'";                    
            }
            str = str.replace( match[i], o);
        }

		try {
        	return str? eval( str )+'' : '';
		}
		catch(e) {
			if( window.console ) console.log( 'Error: ' + e.message + ', expr: ' + str );
			return '';	
		}
    }
    
    function strEscape( str ) {
		return str.replace(/'/g, '\\\'')
		          .replace(/\n/g, '\\n')
		          .replace(/\t/, '\\t');
	}
};

//******************************************************************************************************************
// Number extensions
//******************************************************************************************************************
Number.prototype.formatDecimal = function() {
	var nStr = this.toFixed(2);
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
};

var KeyGen = new function() {
	this.generateKey = function() {
		var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var string_length = 8;
		var randomstring = '';
		for (var i=0; i<string_length; i++) {
			var rnum = Math.floor(Math.random() * chars.length);
			randomstring += chars.substring(rnum,rnum+1);
		}
		return randomstring;
	}
}

var NumberUtils = new function() {
    this.toNumber = function( val ) {
        if(val==null || val=="") return null;
        var n = eval(val);
        return n;
    }

    this.toInteger = function( val ) {
        return parseInt(val);
    }

    this.toDecimal = function( val ) {
        if( val.indexOf( ".") < 0 ) {
            return eval(parseFloat(val).toFixed(2));
        }
        else {
            return eval(val);
        }
    }
}
