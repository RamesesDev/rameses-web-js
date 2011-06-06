/***
    version 1.5.25.7
    resources in the js script:
	NumberUtils
    DynamicProxy
    BindingUtils
    BeanUtils
    Controller
    ContextManager
    RequiredValidator
    Opener
    InvokerUtil = for launching actions from plugins.
    WindowUtil
    ProxyService

    added table plugin
    added fileupload support

    added also String prototype attributes: trim, startsWith, endsWith

    //handlers are injected at the bottom.
**/

//******************************************************************************************************************
// String extensions
//******************************************************************************************************************
String.prototype.trim = function(){ return (this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""))};
String.prototype.startsWith = function(str) {return (this.match("^"+str)==str)};
String.prototype.endsWith = function(str) {return (this.match(str+"$")==str)};
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
        var match = str.match(/[a-zA-Z_\$]+[a-zA-Z_\$\d\.]*|'[^']*'|"[^"]*"/g);
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
                    o = "'" + o + "'";
                else if ( o == null || typeof o === 'undefined' )
                    o = 'null';
                else
                    o = "'[object]'";
            }
            str = str.replace( match[i], o);
        }

        return str? eval( str )+'' : '';
    }
};

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
            alert( parseFloat(val).toFixed(2) );
            return parseFloat(val).toFixed(2);
        }
        else {
            return eval(val);
        }
    }
}

var BindingUtils = new function() {
    //loads all controls and binds it to the context object

    this.handlers = {};
    this.loaders = [];
    this.input_attributes = {};

	var controlLoader =  function(idx, elem) {
		var $e = $(elem);
		var isVisible = true;

		if( $e.attr('visibleWhen') ) {
			var expr = $e.attr('visibleWhen');
			var ctxName = $e.attr('context');
			try {
				var res = expr.evaluate( $ctx(ctxName) );
				isVisible = (res != 'false' && res != 'null');
			}
			catch(e) {
				if( window.console ) console.log('error evaluating visibleWhen: ' + e.message);
				isVisible = false;
			}
		}
		
		if( isVisible ) {
			if( $e.is(':hidden') ) $e.show();
		}
		else {
			$e.hide();
		}
		
	    var _self = BindingUtils;
		var contextName = $(elem).attr( 'context' );
        var controller = $get(contextName);
        if( controller != null ) {
			if( controller.name == null ) controller.name = contextName;
            var n = elem.tagName.toLowerCase()
            if(n == "input") n = n + "_" + elem.type ;
			if( _self.handlers[n] ) _self.handlers[n]( elem, controller, idx );
        }
    };

	var containerLoader = function(idx, div ) {
		var contextName = div.getAttribute('context');
		if(div.id==null || div.id=='') div.id = contextName;
		var controller = $get(contextName);
		if( controller != null ) {
			if( controller.name == null ) controller.name = contextName;
			if( div.getAttribute("loadAction")!=null) controller.loadAction = div.getAttribute("loadAction");
			controller.load();
		}
	};

    this.bind = function(selector) {
		//just bind all elements that has the attribute context
        $("[context][context!='']", selector? selector : null).each ( controlLoader );
    };

    this.loadViews = function(selector) {
		//var predicate = (ctxName!=null && ctxName!="") ? "[context][context='"+ctxName+"']" : "[context][context!='']";
        //loads all divs with context and displays the page into the div.
        $('div[context][context!=""]', selector? selector : null).each ( containerLoader );
    };

    //utilities
    /*
    * use init input for input type of element. this will set/get values for one field
    * applicable for text boxes, option boxes, list.
    * assumptions:
    *     all controls have required,
    *     all controls set a single value during on change
    *     all controls get the value from bean during load
    *     all will broadcast to to reset dependent controls values, (those with depends attribute)
    * customFunc = refers to the custom function for additional decorations
    */
    this.initInput = function( elem, controller, customFunc ) {
        var fldName = elem.name;
        if( fldName==null || fldName=='' ) return;
        var c = controller.get(fldName);
        var o = $(elem);
        if(customFunc!=null) {
            customFunc(elem, controller);
        }
        elem.value = (c ? c : "" );
        var dtype = o.attr("datatype");
        if(dtype=="decimal") {
            elem.onchange = function () { $get(controller.name).set(fldName, NumberUtils.toDecimal(this.value) ); }
        }
        else if( dtype=="integer") {
            elem.onchange = function () { $get(controller.name).set(fldName, NumberUtils.toInteger(this.value) ); }
        }
        else if( dtype == "date" ){
			o.datepicker({dateFormat:"yy-mm-dd"});
            elem.onchange = function () { $get(controller.name).set(fldName, this.value ); }
        }
        else {
            elem.onchange = function () { $get(controller.name).set(fldName, this.value ); }
        }

		//add hints
		if( $(elem).attr("hint")!=null ) {
			new InputHintDecorator( elem );
		}

        //add additional input behaviors
        for(var key in this.input_attributes) {
            if( !$(elem).attr(key) ) return;
			
			var func = this.input_attributes[key];
			if( typeof func == 'function' ) func(elem, controller, $(elem).attr(key));
        }
    };

	this.notifyDependents = function(dependName, _context) {
		var ct = (_context !=null) ? _context + " " : "";
		var predicate = "[depends*='"+dependName+"'][context!='']";
		var filter =  ct + 'select'+predicate+',';
        filter += ct + 'input'+predicate+',';
        filter += ct + 'textarea'+predicate+', ';
        filter += ct + 'table'+predicate+', ';
        filter += ct + 'label'+predicate;
		$(filter).each( controlLoader );
	};


	this.load = function(selector) {
		for( var i=0; i < this.loaders.length; i++ ) {
            this.loaders[i]();
        }
        this.loaders = [];
        this.bind(selector);
        this.loadViews(selector);
	};

	/**---------------------------------------------------*
	 * input hint support (InputHintDecorator class)
	 *
	 * @author jaycverg
	 *----------------------------------------------------*/
	function InputHintDecorator( inp ) {
		var input = $(inp);
		if( input.data('hint_decorator') ) {
			input.data('hint_decorator').refresh();
			return;
		}

		input.keyup(input_keyup)
		 .keypress(input_keypress)
		 .focus(input_focus)
		 .blur(input_blur)
		 .data('hint_decorator', this);

		var span = $('<span class="hint" style="position:absolute; z-index:100; overflow: hidden;"></span>')
		 .html( $('<nobr></nobr>').append(input.attr('hint')) )
		 .hide()
		 .disableSelection()
		 .insertBefore( input )
		 .click(onClick);

		this.refresh = refresh;

		//refresh
		refresh();
		
		if( document.activeElement == input[0] ) input_focus();

		//reposition span on window resize
		$(window).bind('resize', position);
		$(document).bind('resize', position);
		if( inp.tagName.toLowerCase() == 'textarea' )
			input.bind('resize', position);

		function refresh(){
			if( !input.val() )
				showHint();
			else
				hideHint();
		}

		function position() {
			if( !span.is(':visible') ) return;
			var pos = input.position();
			var css = {left: pos.left + parseInt( input.css('paddingLeft') ) + 5};
			var paddingTop = parseInt( input.css('paddingTop') );
			var inpHeight = input[0].offsetHeight;
			var spanHeight = span[0].offsetHeight;

			if( inp.type == 'text' || inp.type == 'password' ) {
				css.top = pos.top + inpHeight/2 - spanHeight/2;
			}
			else {
				css.top = pos.top + paddingTop;
			}
			
			css.width = input.width() - parseInt(input.css('borderRightWidth')) - 1;
			span.css( css );
		}

		function showHint() {
			span.show();
			position();
		}

		function hideHint() {
			span.hide();
		}

		function onClick(){
			input.focus();
		}

		function input_focus() {
			if(!span.hasClass('hint-hover')) span.addClass('hint-hover');
		}

		function input_blur() {
			if(span.hasClass('hint-hover')) span.removeClass('hint-hover');
			refresh();
		}

		function input_keyup() {
			if( !input.val() ) showHint();
		}

		function input_keypress(evt) {
			if( isCharacterPressed(evt) ) hideHint();
		}

		function isCharacterPressed(evt) {
			if (typeof evt.which == "undefined") {
				return true;
			} else if (typeof evt.which == "number" && evt.which > 0) {
				return !evt.ctrlKey && !evt.metaKey && !evt.altKey && evt.which != 8 && evt.which != 13;
			}
			return false;
		}

	}//-- end of InputHintDecorator class

} //-- end of BindingUtils class



//BeanUtils is for managing nested beans
var BeanUtils = new function(){
    this.setProperty = function( bean, fieldName, value ) {
		try {
			eval( 'bean.'+fieldName + '= value');

			var pcl = bean.propertyChangeListener;
			if( pcl && pcl[fieldName] ) {
				pcl[fieldName]( value );
			}
		}
		catch(e){;}
    }

    this.getProperty = function( bean, fieldName ) {
		try {
        	return eval( 'bean.' + fieldName );
        }
        catch(e) {;}
    }

	this.invokeMethod = function( bean, action, args ) {
		var _act = action;
        if(!_act.endsWith("\\)")) {
			if(args==null) {
				_act = _act + "()";
            }
            else {
				_act = _act + "(args)";
            }
        }
        return eval('bean.' + _act );
	}
}

//VALIDATORS
function RequiredValidator( fieldName, caption ) {
    this.fieldName = fieldName;
    this.caption = caption;

    this.validate = function( obj, errs ) {
        var data = BeanUtils.getProperty( obj, this.fieldName );
        if( data == "" || data == null ) errs.push( this.caption + " is required" );
    }
}

function Controller( code, pages ) {

    this.name;
    this.pages = pages;
    this.code = code;
    this.loadAction;
    this.window;
	this.currentPage;
	
    this.set = function(fieldName, value) {
        BeanUtils.setProperty( this.code, fieldName, value );
		this.notifyDependents( fieldName );
    }

	this.notifyDependents = function(dependName) {
		BindingUtils.notifyDependents( dependName );
	}

    this.get = function(fieldName ) {
        return BeanUtils.getProperty( this.code, fieldName );
    }

    this.refresh = function( fieldNames ) {
        //try to use jquery here.
        if(this.name!=null) BindingUtils.bind()
    }

    this.reload = function() {
        this.navigate( "_reload" );
    }

    this.invoke = function( control, action, args, immed  ) {
        if( action.startsWith("_") ) {
            this.navigate( action, control );
        }
        else {
            try {
                var immediate =  false;
				if( immed !=null ) immediate = immed;
                var target = this.name;
                //check validation if not immediate.
                if(control!=null ) {
                    if(control.getAttribute("immediate")!=null && control.getAttribute("immediate")!=null) {
                        immediate = control.getAttribute("immediate");
                    }
                    if(control.getAttribute("target")!=null && control.getAttribute("target")!='' ) {
                        target = control.getAttribute("target");
                    }
                }
                if(immediate=="false" || immediate==false) this.validate();
                if(this.code == null) throw new Error( "Code not set");
                var outcome = action;
                if( !outcome.startsWith("_")) {
                    outcome = BeanUtils.invokeMethod( this.code, action, args );
                }
                this.navigate( outcome, control );
            }
            catch(e) {
                alert( e.message, "ERROR!" );
            }
        }
    }

    this.navigate = function(outcome, control) {
        if(outcome==null) {
            this.refresh();
        }
        else if(outcome.classname == 'opener' ) {
			outcome.parent = this.name;
			outcome.source = control;
			outcome.load();
        }
        else if( outcome == "_close" ) {
			if( this.window && this.window.close ) {
                this.window.close();
            }
        }
        else {
			if( outcome == "_reload" ) outcome = this.currentPage;
			if( outcome == null ) outcome = "default";
			
            if(outcome.startsWith("_")) outcome = outcome.substring(1);
			this.currentPage = outcome;
            var target = this.name;
            var _controller = this;
			
            $('#'+target).load( this.pages[outcome], WindowUtil.getParameters(), function() { 
                if( _controller.code.onpageload != null ) _controller.code.onpageload(outcome);
                _controller.refresh(); 
            } );
        }
    }

    this.validate = function() {
        var errs = [];
        var _code = this.code;
        var d = '[context="' + this.name + '"][required=true]';
        var filter = "input"+d+", select"+d+", textarea"+d;
        $(filter).each(
            function(idx, elem) {
                var o = $(elem);
                if( o.is(':hidden') ) return; //validate the visible elements only
                
                var fldName = elem.name;
                var caption = fldName;
                if( o.attr("caption")!=null ) caption = o.attr("caption");
                new RequiredValidator(fldName, caption ).validate( _code, errs );
            }
        )
        if( errs.length > 0 ) {
            throw new Error( errs.join("\n") );
        }
    }

    this.load = function() {
        if( this.loadAction!=null ) {
            var result = this.invoke( null, this.loadAction );
            if(result==null) {
                this.navigate( "default" );
            }
        }
        else {
            this.navigate( "default" );
        }
    }
}


var ContextManager = new function() {
    this.data = {}
    
    this.create = function( name, code, pages ) {
        if(name==null)
            throw new Error("Please indicate a name");
        var c = new Controller( code, pages );
        if(code.onload!=null) {
            BindingUtils.loaders.push( function() { code.onload() } );
        }
		code._controller = c;
		c.name = name;
        this.data[name] = c;
        return c;
    },

    this.get = function(name) {
        var c = this.data[name];
        if( c == null ) throw new Error(name + " does not exist");
        return c;
    }

}

//load binding immediately
$(window).load (
    function() {
        BindingUtils.load();
    }
);


//important keyword shortcuts used by the programmer
function $get( name ) { return ContextManager.get(name); };
function $put( name, code, pages ) {return ContextManager.create( name, code, pages );};
function $ctx(name) {return ContextManager.get(name).code;};
function $load(func) {  BindingUtils.loaders.push(func); };

//******************************************************************************************************************
// configure input controls
//******************************************************************************************************************
BindingUtils.handlers.input_text = function(elem, controller, idx ) {
	BindingUtils.initInput(elem, controller, function(elem,controller) {
		var input = $(elem);
		if( input.attr('suggest') && input.autocomplete ) {
			var src = controller.get(input.attr('suggest'));
			if( typeof src ==  'function' ) {
				var fn = src;
				src = function(req, callback) {
					var result = fn( req.term, callback);
					if( result ) callback(result);
				}
			}
			input.autocomplete({ source: src });
		}
	});
};

BindingUtils.handlers.input_password = function(elem, controller, idx ) { BindingUtils.initInput(elem, controller ); };
BindingUtils.handlers.textarea = function(elem, controller, idx ) { BindingUtils.initInput(elem, controller); };
BindingUtils.handlers.select = function(elem, controller, idx ) {
	var i = 0;
	$(elem).empty();
	if($(elem).attr("allowNull")!=null) {
		var txt = $(elem).attr("emptyText");
		if(txt==null) txt = "-";
		elem.options[0] = new Option(txt,"");
		i = 1;
	}
	
	var name = $(elem).attr('name');
	var items = $(elem).attr("items");
	var selected = controller.get( name );
	
	if( items!=null && items!='') {
		var itemKey = $(elem).attr("itemKey");
		var itemLabel = $(elem).attr("itemLabel");
		var arr = controller.get(items);
		$(arr).each( function(idx,value) {
			var _key = value;
			if( itemKey != null ) _key = value[itemKey];
			var _val = value+'';
			if( itemLabel != null ) _val = value[itemLabel];

			var op = new Option(_val,_key+'');
			
			$(op).data('object_value', _key);
			elem.options[idx+i] = op;
			op.selected = (_key == selected);
		});
	}

	if( name && !$(elem).data('___changed_attached') ) {
		$(elem).change(function(){
			var op = this.options[this.selectedIndex];
			$get(controller.name).set(name, $(op).data('object_value') );
		})
		.data('___changed_attached', true);
	}

	//fire change after bind to set default value
	$(elem).change();
}

BindingUtils.handlers.input_radio = function(elem, controller, idx ) {
	var c = controller.get(elem.name);
	var value = $(elem).attr("value");
	elem.checked = (c==value) ? true :  false;
	elem.onchange = function () {
		if( this.checked ) {
			$get(controller.name).set(this.name, this.value );
		}
	}
}

BindingUtils.handlers.input_checkbox = function(elem, controller, idx ) {
	var c = controller.get(elem.name);
	if( $(elem).attr("mode") == "set" ) {
		try {
			var checkedValue = $(elem).attr("checkedValue");

			if( c.find( function(o) { return (o==checkedValue ) } ) !=null) {
				elem.checked = true;
			}
			else {
				elem.checked = false;
			}
			elem.onclick = function () {
				var _list = $get(controller.name).get(this.name);
				var v = $(this).attr( "checkedValue" );
				if( v == null ) alert( "checkedValue in checkbox must be specified" );
				if(this.checked) {
					_list.push( v );
				}
				else {
					_list.removeAll( function(o) { return (o == v) } );
				}
			}
		}
		catch(e) {}
	}
	else {
		var isChecked = false;
		var checkedValue = $(elem).attr("checkedValue");
		if( checkedValue !=null && checkedValue == c ) {
			isChecked = true;
		}
		else if( c == true || c == "true" ) {
			isChecked = true;
		}
		elem.checked = isChecked;
		elem.onclick = function () {
			var v = ($(this).attr( "checkedValue" )==null) ? true : $(this).attr( "checkedValue" );
			var uv = ($(this).attr( "uncheckedValue" )==null) ? false : $(this).attr( "uncheckedValue" );
			$get(controller.name).set(this.name, (this.checked) ? v : uv );
		}
	}
}

BindingUtils.handlers.input_button = function( elem, controller, idx ) {
    var action = elem.getAttribute("name");
    if(action==null || action == '') return;
    elem.onclick = function() { 
		$get(controller.name).invoke( this, action );  
	}
};

BindingUtils.handlers.a = function( elem, controller, idx ) {
	var $e = $(elem);
    var action = $e.attr("name");
    
    //add an href property if not specified,
    //css hover does not apply when no href is specified
    if( !$e.attr('href') ) $e.attr('href', '#');
    
    elem.onclick = function() { 
		if( action ) {
			try {
				$get(controller.name).invoke( this, action ); 
			}
			catch(e) {
				if( window.console ) console.log( e.message );	
			}
		}
		return false; 
	}
}

BindingUtils.handlers.input_submit = function( elem, controller, idx ) {
    var action = elem.getAttribute("name");
    if(action==null || action == '') return;
    elem.onclick = function() { $get(controller.name).invoke( this, action );  }
};

BindingUtils.handlers.label = function( elem, controller, idx ){
	var lbl = $(elem);
	var ctx = $ctx(controller.name);
	var expr;
	if( lbl.data('expr')!=null ) {
		expr = lbl.data('expr');
	} else {
		expr = lbl.html();
		lbl.data('expr', expr);
	}
	lbl.html( expr.evaluate(ctx) );
	
	//bind label elements
	BindingUtils.bind( lbl );
};

//------ input text case support ----
BindingUtils.input_attributes.textcase = function(elem, controller, textcase) {
	if( textcase != 'upper' && textcase != 'lower' ) return;
	if( $(elem).data('___txtcs') ) return;
	
	$(elem).data('___txtcs', true)
	 .keydown(function(e) {
		if( e.keyCode >= 65 && e.keyCode <= 92 ) {
			var str = String.fromCharCode(e.keyCode);
			str = (textcase == 'lower'? str.toLowerCase() : str.toUpperCase());
			var arr = this.value.split('');
			arr.splice( this.selectionStart, this.selectionEnd, str );
			this.value = arr.join('');
			$(this).trigger('keypress', e);
			return false;
		}
	 });
};


/**----------------------------------*
 * file upload plugin
 *
 * @author jaycverg
 *-----------------------------------*/
BindingUtils.handlers.span = function( elem, controller, idx ) {

	var div = $(elem);

	if( div.attr('type') != 'fileupload' ) return;
	if( div.data('_binded') ) return;

	div.css('display', 'block').addClass('file-uploader').data('_binded', true);

	//-- properties/callbacks
	var oncomplete = div.attr('oncomplete')? controller.get(div.attr('oncomplete')) : null;
	var onremove =   div.attr('onremove')? controller.get(div.attr('onremove')) : null;
	var labelExpr =  div.attr('label');

	//upload box design
	var listBox =       $('<div class="files"></div>').appendTo(div);
	var inputWrapper =  $('<div style="overflow: hidden; position: relative;"></div>');
	var anchorLbl =     $('<a href="#">' + div.attr('caption') + '</a>');
	var anchorBox =     $('<div class="selector"></div>');

	anchorBox.appendTo( div )
	.append( anchorLbl )
	.append( inputWrapper );

	var lblWidth =  anchorLbl[0].offsetWidth;
	var lblHeight = anchorLbl[0].offsetHeight;
	inputWrapper.css({left: 0, top: -lblHeight, width: lblWidth});
	anchorBox.css('height', lblHeight);

	attachInput();

	function file_change(e) {
		var frameid = '__frame' + Math.floor( Math.random() * 200000 );
		var input =   $(this).remove().attr('name', frameid);
		var frame =   createFrame(frameid);
		var form =    createForm(frameid, input);
		var pBar =    $('<div class="bar"><div class="progress"></div></div>');

		addToFileList(frame, form, pBar, input);

		var req = new ProgressRequest( pBar, frameid );
		frame.load(function(){
			req.completed();
			frame_loaded(frame);
		});

		form.submit(function(){
			req.start();
		});

		attachInput();
		form.submit();
	}

	function frame_loaded(frame) {
		var value = null;
		var lbl = frame.parent().find('div.label')

		try {
			value = $.parseJSON(frame.contents().text());
		}catch(e){;}

		if( oncomplete )         safeExecute(function() { oncomplete( value ); });
		if( labelExpr && value ) lbl.html( labelExpr.evaluate(value) );

		if( onremove ) {
			$('<a href="#" class="remove">Remove</a>')
			 .appendTo( lbl )
			 .click(function(){
				var res = safeExecute(function(){ return onremove( frame.parent().index(), value ); });
				if( res == false || res == 'false' ) return;
				frame.parent().animate({opacity: 0}, {duration:400, complete:function(){ $(this).remove(); }});
			 });
		}
	}

	function safeExecute( fn ) {
		try {
			return fn();
		}
		catch(e) {
			if( window.console ) console.log( e.message );
		}
		return null;
	}

	function addToFileList(frame, form, pBar, input) {
		var b = $.browser;

		//decorate progress bar
		pBar.find('div.progress')
		.addClass( b.msie? '' : b.webkit? 'webk' : 'moz' )
		.attr('id', frame.attr('id') + '_progress');

		//create the file item box
		var fibox = $('<div class="file"></div>')
		 .appendTo( listBox )
		 .append( frame )
		 .append( form )
		 .append('<div class="label">' + input.val() + '</div>')
		 .append( pBar );
	}

	function createFrame( id ) {
		return $('<iframe src="" id="'+id+'" name="'+id+'"></iframe>').hide();
	}

	function createForm( target, input ) {
		return $('<form method="post" enctype="multipart/form-data"></form>')
			    .attr({ 'target': target, 'action': div.attr('url') })
			    .append( input )
			    .append( '<input type="hidden" name="file_id" value="' +target+ '"/>' )
			    .hide();
	}

	function attachInput() {
		var input = $('<input type="file" name="file" style="position:relative;opacity:0;filter:alpha(opacity=0)"/>');
		input.appendTo( inputWrapper ).change(file_change).css({left: -(input[0].offsetWidth - lblWidth)});
	}

	//-- utility inner class for file status pulling --
	function ProgressRequest( bar, reqId ) {

		var progress = bar.find('div.progress');
		var completed = false;


		this.start = function() {
			pullUpdates();
		};

		this.completed = function() {
			updateProgress( 100 );
			completed = true;
		};

		function pullUpdates() {
			if( completed ) return;

			$.ajax({
				url: div.attr('url'),
				cache: false,
				data: 'fileupload.status=' + reqId,
				success: onPullResponse
			});
		}

		function onPullResponse(data) {
			try {
				var resp = $.parseJSON(data);
				//alert( data );
				updateProgress( resp.percentCompleted );
			}
			catch(e) {;}

			if( !completed ) {
				//throws error in IE if no deplay specified
				setTimeout( pullUpdates, 5 );
			}
		}

		var prevValue = 0;

		function updateProgress( value ) {
			value = (typeof value == 'number')? value : 0;
			prevValue = (value > prevValue)? value : prevValue;
			progress.stop().animate({width: prevValue+'%'}, {duration: 100, complete: function() {
				if( completed ) {
					bar.animate({opacity: 0}, {duration: 600, complete: function() {
						$(this).hide('fast');
					}});
				}
			}});
		}

	}

};// --- end of file upload plugin ---


/**----------------------------------*
 * table plugin
 *   - added visibleWhen property on <tr></tr> element
 *
 * @author jaycverg
 *-----------------------------------*/
BindingUtils.handlers.table = function( elem, controller, idx ) {

	if( $(elem).data('_has_model') ) return;
	if( !window.___table_ctr ) window.___table_ctr = 0;

	var tbl = $(elem);
	if( !tbl.data('index') ) tbl.data('index', ( window.___table_ctr += 1000));
	new DataTable( tbl, $ctx(controller.name), controller );

};

/*------ DataTable class ---------*/
function DataTable( table, bean, controller ) {

	var model = new DefaultTableModel( table );

	var multiselect = table.attr('multiselect') == 'true';
	var varStat =     table.attr('varStatus');
	var varName =     table.attr('varName');
	var name =        table.attr('name');
	var script =      table.attr('script');


	if( table.attr('items') ) {
		model.setList( controller.get(table.attr('items')) );
	}
	if( table.attr('model') ) {
		model.setDataModel( controller.get(table.attr('model')) );
		table.data('_has_model', true);
	}

	var status = {prevItem: null, nextItem: null};
	var tbody = table.find('tbody');

	var tpl = table.data('template');
	if( !tpl ) {
		tpl = tbody.find('tr').remove();
		table.data('template', tpl);
	}

	model.onRefresh = function() { doRender() };
	model.load();

	var tabIdx;

	function doRender() {
		tbody.hide('fade').empty();
		tabIdx = table.data('index');
		status.index = 0;
		var list = model.getList();
		if(list==null) list = [];
		
		var selected = name? controller.get(name) : null;
		var selectedTds = [];

		//render the rows
		for(var i=0; i<list.length; ++i) {
			var item = list[i];
			status.prevItem = (i > 0)? list[i-1] : null;
			status.nextItem = (i < list.length-1)? list[i+1] : null;

			executeScript(item);
			var row = createRow(i, item).appendTo( tbody );
			if( selected == item ) {
				var pos = table.data('selected_position');
				var td = pos ? $(row[pos.row]).find('td')[pos.col] : row.find('td:first')[0];
				selectedTds.push( td )
			};
			status.index++;
		};

		var rows = model.getRows();
		if( rows != -1 && list.length < rows ) {
			//add extra rows if the items size is less than the no. of rows
			for(var i=list.length; i<rows; ++i ) {
				createRow(i, null).appendTo( tbody );
				status.index++;
			}
		}

		tbody.stop().show('fade');
		
		$(selectedTds).each(function(i,e){ td_mousedown(e, true); });

		BindingUtils.bind( table );
	}

	
	var scriptFn;
	
	function executeScript( _itm ) {
		if( !script ) return;
		if( !scriptFn ) {
			var args = [];
			args.push( varName || '___arg1' );
			args.push( varStat || '___arg2' );
			if( varName )
				scriptFn = eval('(function ___eval(' + args.join(',') + ') { ' + script + ' })');
			else
				scriptFn = eval('(function ___eval(' + args.join(',') + ') { with(___arg1){ ' + script + ' }})');
		}
		try {
			scriptFn( _itm, status );
		}
		catch(e){
			if( window.console ) console.log( e.message );
		}
	}
	
	function createRow(i, item) {
		return tpl.clone()
		 .data('index', i)
		 .each(function(i,e)
		  {
			var tr = $(e);
			var origTr = $(tpl[i]);

			evalAttr(origTr[0],e,item);
			if( $(e).attr('visibleWhen') ) {
				var visible = $(e).attr('visibleWhen').evaluate( function(n) { return resolve(n, item); } );
				if( visible != 'true' ) $(e).css('display', 'none');
			}

			var td = tr.find('td')
			           .mousedown( td_mousedown )
			           .hover( td_mouseover, td_mouseout );;
			var origTd = origTr.find('td');

			if( !item ) {
				td.html('&nbsp;');
			}
			else {
				td.each(function(idx,e){
					var td = $(e).data('position', {row: i, col: idx }); //keep the td position
					var value;
					if( td.attr('name') )
						value = resolve( td.attr('name'), item );
					else if ( td.attr('expression') )
						value = td.attr('expression').evaluate(  function(n) { return resolve(n, item); }  );
					else
						value = unescape(td.html()).evaluate(  function(n) { return resolve(n, item); }  );

					td.html( value? value+'' : '&nbsp;' );

					if( td.attr('editable') == 'true' ) {
						td.attr('tabindex', tabIdx++)
						  .keydown(td_keydown)
						  .focus(function(e) { td_edit(e, this); })
						  .dblclick(td_edit);
					}

					evalAttr(origTd[idx],e,item);
				});
			}
		 }); //-- end of each function
	}//-- end of createRow function


	//-- TD event support --
	var prevRow;
	var prevTd;

	function td_mousedown(e, forced) {
		var td = e.tagName? $(e) : $(this);

		if( td.attr('selectable') == 'false' ) return;
		if( td.parent().attr('selectable') == 'false' ) return;
		if( prevTd ) prevTd.removeClass('selected');

		if( td.hasClass('selected') )
			td.removeClass('selected');
		else
			td.addClass('selected');

		prevTd = td;
		
		if( !multiselect && prevRow ) {
			prevRow.removeClass('selected');
			model.unselect( prevRow.data('index') );
		}
		
		var tr = td.parent();
		if( tr.hasClass('selected') ) {
			tr.removeClass('selected');
			model.unselect( tr.data('index') );
		}
		else {
			tr.addClass('selected');
			model.select( tr.data('index') );
		}

		prevRow = tr;
		
		//if name is specified, update the value
		if( !forced && name ) {
			var items = model.getSelectedItems();
			if( items ) {
				controller.set( name, multiselect? items : items[0] );	
			}
			
			//keep the selected td index to the table element
			table.data('selected_position', td.data('position'));
		}
	}
	
	function td_mouseover() {
		$(this).addClass('hover')
		 .parent().addClass('hover');
	}
	
	function td_mouseout() {
		$(this).removeClass('hover')
		 .parent().removeClass('hover');
	}

	function td_keydown(e) {
		td_edit(e, this);
	}

	var editor;

	function td_edit(e, src) {
		var td = $(src? src : this);
		if( td.data('editing') ) return;
		td_mousedown( td[0] );

		if( !editor ) editor = TableCellEditor.getInstance();
		editor.show( td );
	}

	function evalAttr(origElem, cloneElem, ctx) {
		var attrs = origElem.attributes;
		for(var i=0; i<attrs.length; ++i) {
			var attr = attrs[i];
			if( !attr.specified || !attr.value ) continue;

			try {
				var attrName = attr.name.toLowerCase();
				var attrValue = $(origElem).attr(attrName).evaluate( function(n) { return resolve(n, ctx); } );
				if( attrName.endsWith('expr') ) {
					attrName = attrName.replace(/expr$/, '');
				}
				$(cloneElem).attr(attrName, attrValue);
			}
			catch(e) {;}
		}
	}

	function resolve( name, ctx ) {
		try {
			var _ctx = ctx;
			if( varStat && name.startsWith( varStat + '\.' ) ) {
				_ctx = [];
				_ctx[varStat] = status;
			}
			else if( varName ) {
				if( name.startsWith( varName + '\.' ) ) {
					_ctx = [];
					_ctx[varName] = ctx;
				}
				else {
					_ctx = bean;
				}
			}

			return BeanUtils.getProperty( _ctx, name );
		}
		catch(e) {
			if( window.console ) console.log( e.message );
		}
		return null;
	}

} //-- end of DataTable class

/*---------- table cell editor ----------------*/
function TableCellEditor() {

	var cell;
	var input;

	init();

	this.show = function( td ) {
		cell = td.tagName? $(td) : td;
		cell.data('editing', cell.html());

		var loc = getLocation( cell[0] );
		input.attr('tabindex', cell.attr('tabindex'))
		 .val( cell.html() )
		 .css({
			'top' : loc.y, 'left' : loc.x,
			'width' : cell[0].offsetWidth, 'height' : cell[0].offsetHeight
		  })
		 .show()
		 .focus()
		 .select();
	};

	function hide() {
		input.val('').hide();
	};

	function init() {
		input = $('#__cell_editor');
		if( input.size() > 0 ) return;

		input = $('<input type="text" id="__cell_editor" class="cell-editor" style="position: absolute; z-index: 999999; border: none;"/>')
		 .hide()
		 .blur( commit )
		 .keydown(function(e){
			if( e.keyCode == 13 ) {
				commit();
				var next = parseInt($(this).attr('tabindex'))+1;
				var tbl = cell.parents('table:first');
				if( !focusNext( tbl, next ) ) {
					focusNext( tbl, tbl.data('index') );
				}
			}
			else if ( e.keyCode == 27 ) {
				revert();
			}
		  })
		 .appendTo( $('body') );
	}

	function focusNext( tbl, next ) {
		var tdElem = tbl.find('td[tabindex="' + next + '"]')[0];
		if( tdElem ) $(tdElem).focus();
		return tdElem != null;
	}

	function commit() {
		if( input.is(':hidden') ) return;
		cell.html( input.val() ).removeData('editing');
		hide();
	}

	function revert() {
		if( input.is(':hidden') ) return;
		cell.html( cell.data('editing') ).removeData('editing');
		hide();
	}

	function getLocation(e) {
		var loc = { x: e.offsetLeft, y: e.offsetTop };
		while( (e = e.offsetParent) ) {
			loc.x += e.offsetLeft;
			loc.y += e.offsetTop;
		}
		return loc;
	}

}

TableCellEditor.getInstance = function() {
	if( !TableCellEditor.__instance ) {
		TableCellEditor.__instance = new TableCellEditor();
	}
	return TableCellEditor.__instance;
};

//end of TableCellEditor class


/*-------- default internal table model ------------------*/
function DefaultTableModel() {

	var _this = this;
	var _list;
	var _dataModel;
	var _listParam = null;
	var _isLast = false;

	var _selectedItems = [];

	//on refresh callback
	_this.onRefresh;

	_this.select = function(idx) {
		if( idx >=0 && idx < _list.length )
			_selectedItems.push( _list[idx] );
	};

	_this.unselect = function(idx) {
		var obj = _list[idx];
		if( _selectedItems.indexOf ) {
			idx = _selectedItems.indexOf( obj );
		}
		//in case indexOf is not supported by the browser
		else {
			idx = -1;
			for(var i=0; i<_selectedItems.length; ++i) {
				if( obj == _selectedItems[i] ) {
					idx = i;
					break;
				}
			}
		}

		if( idx >= 0 ) _selectedItems.splice(idx, 1);
	};

	_this.getRows = function() {
		return _listParam? _listParam._limit-1 : -1;
	};

	_this.setDataModel = function( mdl ) {
		_dataModel = mdl;
		initDataModel();
	};

	_this.getDataModel = function() { return _dataModel; };

	_this.setList = function( list ) {
		_list = list;
		_selectedItems = [];
		if( _listParam ) {
			if( _list.length == _listParam._limit ) {
				_list.length = _listParam._limit-1;
				_isLast = false;
			}
			else {
				_isLast = true;
			}
		}
	};

	_this.getList = function() {
		if( typeof _list == 'undefined' ) _list = [];
		return _list;
	};

	_this.load = function() {
		if( _listParam ) _listParam._start = 0;
		doRefresh(true);
	};
	
	_this.getSelectedItems = function() {
		return _selectedItems;
	};

	function doRefresh( fetch ) {
		if( fetch == true ) {
			if( _dataModel && $.isFunction( _dataModel.fetchList ) ) {
				var result = _dataModel.fetchList( _listParam );
				if( typeof result != 'undefined' ) {
					_this.setList( result );
				}
			}
		}
		if( $.isFunction( _this.onRefresh ) )
			_this.onRefresh();
	}

	/**
	 * inject callback methods to the passed dataModel
	 * methods to be injected:
	 *   1. refresh( <optional boolean parameter> )
	 *      - the boolean parameter if true, the table fetches the list
	 *   2. load
	 *      - reloads the table, resets the start row to 0 (zero)
	 *   3. moveFirst, moveNext, movePrev, getSelectedItem, getSelectedItems
	 */
	function initDataModel() {
		if( !_dataModel ) return;

		_listParam = null;

		_dataModel.setList = function( list ) { _this.setList(list); };
		_dataModel.load = function() { _this.load(); };

		_dataModel.refresh = function( fetch ) {
			doRefresh( fetch );
		};

		_dataModel.moveFirst = function() {
			_listParam._start = 0;
			doRefresh(true);
		};

		_dataModel.moveNext = function() {
			if( _listParam && !_isLast ) {
				_listParam._start += _listParam._limit-1;
			}
			doRefresh(true);
		};

		_dataModel.movePrev = function() {
			if( _listParam && _listParam._start > 0 ) {
				_listParam._start -= _listParam._limit-1;
			}
			doRefresh(true);
		};

		_dataModel.getSelectedItem = function() {
			var len = _selectedItems.length;
			return len > 0? _selectedItems[len-1] : null;
		};

		_dataModel.getSelectedItems = function() { return _selectedItems; };

		if( _dataModel.rows ) {
			_listParam = {};
			_listParam._limit = _dataModel.rows+1;
			_listParam._start = 0;
		}
	}

}
// end of DefaultTableModel class

//******************************************************************************************************************
// type of openers...
//req. Opener must have an interface
//  classname = 'opener'
//  load();
//******************************************************************************************************************
function PopupOpener( page, name, params, target ) {
    this.classname = "opener";
    this.name = name;
    this.page = page;
    this.target = target;
    this.params = params;
	this.parent;
	this.parentTarget;
	this.title;
	this.source;
	this.options = {};

	var defaultOptions = {show: 'fade', hide: 'fade', height: 'auto'};

    this.load = function() {
        var n = this.name;
        var p = this.params;
		var parent = this.parent;
		var target = this.target;

        var div = null;
        if( target ) {
        	div = $( "#"+target );
        }
        else {
        	var id = 'popup_' + Math.floor( Math.random() * 200000 );
        	div = $('<div id="' + id + '"></div>').appendTo('body');
        }

		//if name not specified, use the filename by convention
		if(n==null || n.trim() == "" ) {
			n = this.page.substring( this.page.lastIndexOf("/")+1, this.page.indexOf(".") );
		}	

		//remove div if dynamically created
		this.options.close = function() { if( !target ) div.remove();	}
		this.options.modal = true;
		this.options.title = this.title;

		var options = $.extend(defaultOptions, this.options);

        div.load(this.page, WindowUtil.getParameters(), function() {
			if( $get(n) == null ) {
				alert( "Error in popup. Context " + n + " not found. Pls. specify a specific context otherwise context is same as page name");
				throw new Error("Popup error");
			}
		
        	if(p!=null) {
                for( var key in p ) {
                    try{ $ctx(n)[key] = p[key]; }catch(e){;}
                }
            }
            BindingUtils.load( div);
			$get(n).window = {
				close: function() { div.dialog("close"); $get(parent).refresh(); }
			};	
            //make into a dialog after the content is loaded.
            div.dialog(options);
        });
    }
}

//-- DropdownOpener class
function DropdownOpener( page, name, params, target ) {
	this.classname = "opener";
    this.name = name;
    this.page = page;
    this.target = target;
    this.params = params;
	this.parent;
	this.title;
	this.source;
	this.options = {};
	this.styleClass;

    this.load = function() {
        var n = this.name;
        var p = this.params;

		//if name not specified, use the filename by convention
		if(n==null || n.trim() == "" ) {
			if( typeof this.page == "string" ) {
				n = this.page.substring( this.page.lastIndexOf("/")+1, this.page.indexOf(".") );
			}	
		}
		var w = new DropdownWindow(this.source, this.options, this.styleClass);
        w.show(this.page, WindowUtil.getParameters(), function(div) {
			if( n!=null ) {
				if(p!=null) {
					for( var key in p ) {
						try{ $ctx(n)[key] = p[key]; }catch(e){;}
					}
				}
			}
			BindingUtils.load( div);
			$get(n).window = { close: function() { w.close();  } }
        });
    };


	//--- DropdownWindow class ----
	function DropdownWindow( source, options, styleClass ) {

		var div = $('<div class="dropdown-window" style="position: absolute; z-index: 200000; top: 0; left: 0;"></div>');

		var defaultConfig = { my: 'left top', at: 'left bottom' };

		if( styleClass ) div.addClass( styleClass );

		this.show = function( page, params, callback ) {
			var posConfig = $.extend(defaultConfig, options.position || {});
			posConfig.of = $(source);

			if( typeof page == 'string' ) {
				div.hide().load( page, params, function(){
					div.appendTo('body')
					 .position( posConfig )
					 .show('fade');

					bindWindowEvt();
					callback(div);
				});
			}
			else {
				div.html( page.html() )
				 .appendTo('body')
				 .position( posConfig )
				 .show('slide',{direction:"up"}, function(){
					bindWindowEvt();
					callback(div);
				 });
			}
		};

		this.close = function() { hide(); };

		function hide() {
			div.hide('slide', {direction:"up"}, function() { $(this).remove(); });
			$(document).unbind('mouseup', onWindowClicked);
		}

		function bindWindowEvt() {
			$(document).bind('mouseup', onWindowClicked);
		}

		function onWindowClicked(evt) {
			var target = $(evt.target).closest('div.dropdown-window');
			if( target.length == 0 ) {
				hide();
			}
		}

	}//-- end of DropdownWindow class

}//-- end of DropdownOpener


var InvokerUtil = new function() {
    this.invoke = function( name, page, target ) {
    	var target = $("#"+target);

    	//load the page first then bind, before appending it to the target
    	target.load(page, WindowUtil.getParameters(), function() {
    		BindingUtils.load( target );
		});
    };
};

var WindowUtil = new function() {
	this.reload = function(args) {
		var qry = "";
		if(args!=null ) {
			for(var k in args) {
				if(qry!="") qry += "&";
				qry += k+"="+escape( args[k] );
			}
		}
		window.location.search = (qry!="") ? "?"+qry : "";
	}

	this.load = function( page, target, options ) {
		$( "#"+target ).load(page, function() {
			BindingUtils.load( "#"+target);
		});
    }

    this.getParameter = function( name ) {
	  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	  var regexS = "[\\?&]"+name+"=([^&#]*)";
	  var regex = new RegExp( regexS );
	  var results = regex.exec( window.location.href );
	  if( results == null )
		return "";
	  else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	this.getParameters = function(){
		var vars = {}, hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars[hash[0]] = this.getParameter(hash[0]);
		}
		return vars;
	}	
	
};

var AjaxStatus = function( msg ) {
	var div = $('<div class="ajax-status" style="position:absolute; z-index:300000"></div>')
	 .html( msg )
	 .hide();

	$(function(){ div.appendTo('body'); });

	this.show = function() {
		position();
		div.show();
	};

	this.hide = function() {
		div.hide('fade');
	};

	function position() {
		div.css({
			'top': '0px', 'left': '0px'
		});
	}
};

$(function(){
	//var ajxStat = new AjaxStatus('Processing ...');
	//$(document).ajaxStart( ajxStat.show ).ajaxStop( ajxStat.hide );
});


function DynamicProxy( context ) {
    this.context = context;
    this.create = function( svcName ) {
        return new _DynamicProxyService( svcName, this.context );
    }

		/* DynamicProxy */
	function _DynamicProxyService( name, context ) {
		this.name = name;
		this.context = context;
		this.env = {};

		var convertResult = function( result ) {
			if(result!=null) {
				//alert( result );
				if( result.trim().substring(0,1) == "["  || result.trim().substring(0,1) == "{"  ) {
					return $.parseJSON(result);
				}
				else {
					return eval(result);
				}
			}
			return null;
		}

		this.invoke = function( action, args, handler ) {
			jargs = null;
			if(args!=null) { jargs = $.toJSON( args ); }
			var contextPath = window.location.pathname.substring(1);
			contextPath = contextPath.substring(0,contextPath.indexOf('/'));
			var urlaction = "/" + contextPath + "/jsinvoker/"+this.context+"/"+this.name+ "."+action;
			var err = null;
			if(handler==null) {
				var result = $.ajax( {
					url:urlaction,
					type:"POST",
					error: function( xhr ) { err = xhr.responseText },
					data: {args: jargs},
					async : false }).responseText;

				if( err!=null ) {
					throw new Error(err);
				}
				return convertResult( result );
			}
			else {
				$.ajax( {
					url: urlaction,
					type: "POST",
					error: function( xhr ) { err = xhr.responseText },
					data: {args: jargs},
					async: true,
					success: function( data) { handler( convertResult(data)); }
				});
			}
		}
	}
}

var ProxyService = new function() {
	this.services = {}
	this.lookup = function(name) {
		if( this.services[name]==null ) {
			var err = null;
			var contextPath = window.location.pathname.substring(1);
			contextPath = contextPath.substring(0,contextPath.indexOf('/'));
			var urlaction = "/" + contextPath + "/remote-proxy/"+name + ".js";
			var result = $.ajax( {
                url:urlaction,
                type:"POST",
                error: function( xhr ) { err = xhr.responseText },
                async : false }).responseText;
			if( err!=null ) {
				throw new Error(err);
            }
			this.services[name] = eval( result );
		}
		return this.services[name];
	}
};