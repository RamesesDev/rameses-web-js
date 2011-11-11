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
if(!Array.indexOf){ //some lower versions of IE doesn't have indexOf
	Array.prototype.indexOf = function(obj){
		for(var i=0; i<this.length; i++){
			if(this[i]==obj){
				return i;
			}
		}
		return -1;
	}
}

Array.prototype.remove = function( from, to ) {
	if( typeof from == 'object' ) {
		var idx = this.indexOf( from );
		if( idx >= 0 ) return this.remove( idx );
		return this;
	}
	else {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	}
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
    while( (match = str.match(/\\?[\$|#]{([^{}]+)}/)) ) {
		if( match[0].length > 3 && match[0][0] == '\\' )
			str = str.replace( match[0], '@@' + match[0].substring(2) );
		else
			str = str.replace( match[0], _evaluate(match[1]) );
    }
	str = str.replace('@@{', '#{');
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

//*****************************************
//Date extensions
//*****************************************
var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};



