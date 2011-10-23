/***
    Rameses UI library
	depends: rameses-extension library
**/

var R = {
	DEBUG: false,
	PREFIX: 'r',
	attr: function(elm, attr, value) {
		attr = this.PREFIX + ':' + attr;
		try {
			if( value )
				return elm.jquery? elm.attr(attr, value) : $(elm).attr(attr, value);
			else
				return elm.jquery? elm.attr(attr) : $(elm).attr(attr);
		}
		catch(e) {
			if( window.console && R.DEBUG ) console.log( e.message );
			return null;
		}
	}
};

var BindingUtils = new function() {
    //loads all controls and binds it to the context object

    this.handlers = {};
    this.loaders = [];
    this.input_attributes = [];

	var controlLoader =  function(idx, elem) {
		var $e = $(elem);
		var isVisible = true;

		if( R.attr($e,'visibleWhen') ) {
			var expr = R.attr($e, 'visibleWhen');
			var ctxName = R.attr($e,'context');
			try {
				var res = expr.evaluate( $ctx(ctxName) );
				isVisible = (res != 'false' && res != 'null');
			}
			catch(e) {
				if( window.console && R.DEBUG ) console.log('error evaluating visibleWhen: ' + e.message);
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
		var contextName = R.attr($(elem),  'context' );
		if( !contextName ) return;
		
        var controller = $get(contextName);
        if( controller != null ) {
			if( controller.name == null ) controller.name = contextName;
			
			if( R.attr($e, 'action') ) {
				var action = R.attr($e, 'action');
				elem.onclick = function() { 
					$get(controller.name).invoke( this, action );  
				}
			}
			
            var n = elem.tagName.toLowerCase()
            if(n == "input") n = n + "_" + elem.type ;
			if( _self.handlers[n] ) _self.handlers[n]( elem, controller, idx );
        }
    };

	var containerLoader = function(idx, div ) {
		var contextName = R.attr(div, 'controller');
		if(div.id==null || div.id=='') div.id = contextName;
		var controller = $get(contextName);
		if( controller != null ) {
			if( controller.name == null ) controller.name = contextName;
			if( R.attr(div, "loadAction")!=null ) controller.loadAction = R.attr(div, "loadAction");
			controller.load();
		}
	};

    this.bind = function(ctxName, selector) {
		//just bind all elements that has the attribute context
		var idx = 0;
        $('*', selector || document).filter(function() {
			if( R.attr(this, 'context') ) controlLoader( idx++, this );
		});
    };

    this.loadViews = function(ctxName, selector) {
        //loads all divs with context and displays the page into the div.
		var idx = 0;
        $('*', selector || document).filter(function() { 
			if( R.attr(this, 'controller') ) containerLoader( idx++, this );
		});
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
        var fldName = R.attr(elem, 'name');
        if( fldName==null || fldName=='' ) return;
        var c = controller.get(fldName);
        var o = $(elem);
        if(customFunc!=null) {
            customFunc(elem, controller);
        }
        elem.value = (c ? c : "" );
        var dtype = R.attr(o, "datatype");
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
		if( R.attr(elem, "hint")!=null ) {
			new InputHintDecorator( elem );
		}

        //add additional input behaviors
        //$(this.input_attributes).each(
        //    function(idx,func) { func(elem, controller); }
        //)
    };

	this.notifyDependents = function(dependName, selector) {
		var idx = 0;
		$('*', selector).filter(function(){
			var attr = R.attr(this, 'depends');
			if( attr && attr.match('.*' + dependName + '.*') ) 
				controlLoader( idx++, this );
		});
	};


	this.load = function(selector) {
		for( var i=0; i < this.loaders.length; i++ ) {
            this.loaders[i]();
        }
        this.loaders = [];

        this.bind(null,selector);
        this.loadViews(null,selector);
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

		input.wrap('<span style="display:inline-block;position:relative"></span>')
		 .keyup(input_keyup)
		 .keypress(input_keypress)
		 .focus(input_focus)
		 .blur(input_blur)
		 .change(input_change)
		 .data('hint_decorator', this);

		var span = $('<span class="hint" style="position:absolute;z-index:100;overflow:hidden;top:0px;left:0px;"></span>')
		 .html( R.attr(input, 'hint') )
		 .hide()
		 .disableSelection()
		 .insertBefore( input )
		 .click(onClick);

		this.refresh = refresh;

		//refresh
		refresh();
		
		if( document.activeElement == input[0] ) input_focus();

		function refresh(){
			if( !input.val() )
				showHint();
			else
				hideHint();
		}

		function position() {
			var pos = input.position();
			var css = {};
			css.left = parseValue(input.css('padding-left')) + parseValue(input.css('margin-left')) + parseValue(input.css('border-left-width'))+2;
			css.top = parseValue(input.css('padding-top')) + parseValue(input.css('margin-top')) + parseValue(input.css('border-top-width'));
			css.width = span[0].offsetWidth > input.width() ? input.width() : span[0].offsetWidth;
			span.css( css );
		}
		
		function parseValue( value ) {
			return value=='auto'? 0 : parseInt( value );
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
		
		function input_change(evt) {
			if( !input.val() )
				showHint();
			else
				hideHint();
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
        catch(e) {
			if( window.console && R.DEBUG ) console.log('BeanUtils.getProperty warning: ' + e.message);
		}
    }

	this.setProperties = function( bean, map ) {
		for( var n in map ) {
			this.setProperty( bean, n, map[n] ); 
		}
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
function RequiredValidator( fieldName, caption, elem ) 
{
    this.fieldName = fieldName;
    this.caption = caption;
	this.elem = elem;

    this.validate = function( obj, errs, errElems ) {
        var data = BeanUtils.getProperty( obj, this.fieldName );
        if( data == "" || data == null ) {
			if( errElems ) errElems.push( this.elem );
			errs.push( this.caption + " is required" );
		}
    }
}

function Controller( code, pages ) {

    this.name;
    this.pages = pages;
    this.code = code;
    this.loadAction;
    this.window;
	this.currentPage;
	this.bookmark;
	
	this.container;
	
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
		var selector;
		if( this.container && this.container.element ) selector = this.container.element;
        if(this.name!=null) BindingUtils.bind( this.name, selector )
    }

    this.reload = function() {
        this.navigate( "_reload" );
    }

    this.invoke = function( control, action, args, immed, refresh  ) {
		try {
			var immediate =  false;
			if( immed !=null ) immediate = immed;
			if( refresh != false ) refresh = true;
			
			//check validation if not immediate.
			if( control ) {
				if( R.attr(control, "immediate") ) {
					immediate = R.attr(control, "immediate");
				}
				if( R.attr(control, "target") ) {
					target = R.attr(control, "target");
				}
				if( R.attr(control, "refresh") ) {
					refresh = R.attr(control, "refresh");
				}
			}
			if(immediate=="false" || immediate==false) this.validate();
			
			//-- process action name
			if( action.startsWith("_") ) {
				if( refresh == true || refresh == 'true' )
					this.navigate( action, control );
			}
			else {
                var target = this.name;
                if(this.code == null) throw new Error( "Code not set");
				
				/*added support for parameters that are set when firing a button or action.*/
				if( R.attr($(control), "params") ) {
					try {
						var _parms  = $.parseJSON(R.attr($(control), 'params'));
						BeanUtils.setProperties( this.code, _parms );
					}
					catch(e) {
						if(window.console && R.DEBUG) console.log("error in control params " + e.message );
					}
				}
				
                var outcome = action;
                if( !outcome.startsWith("_")) {
                    outcome = BeanUtils.invokeMethod( this.code, action, args );
                }
				if( refresh == true || refresh == 'true' )
					this.navigate( outcome, control );
            }
        }
		catch(e) {
			alert( e.message, "ERROR!" );
		}
    }

    this.navigate = function(outcome, control) {
        if(outcome==null) {
			if(this.container && this.container.refresh) {
				this.container.refresh();
			}
			else {
				this.refresh();
			}
        }
        else if(outcome.classname == 'opener' ) {
			outcome.caller = this;
			outcome.source = control;
			outcome.load();
        }
        else if( outcome == "_close" ) {
			if( this.container && this.container.close ) {
                this.container.close();
            }
        }
		else if( outcome == "_reload" ) {
			if(this.container && this.container.reload) {
				this.container.reload();	
			}
			else {
				//intended only for <div context="name"></div>
				var _outcome = this.currentPage;	
				var _target = this.name;
				var _controller = this;
				$('#'+_target).load( this.pages[_outcome], WindowUtil.getAllParameters('#'+_target), function() { 
					if( _controller.code.onpageload != null ) _controller.code.onpageload(_outcome);
					_controller.refresh(); 
				} );
			}
		}
        else {
			//intended only for <div r:controller="name"></div>
			if( outcome == null ) outcome = "default";
            if(outcome.startsWith("_")) outcome = outcome.substring(1);
			
			var qrystr;
			if( outcome.indexOf('?') >= 0 ) {
				outcome = outcome.split('?');
				qrystr = outcome[1];
				outcome = outcome[0];
			}
			
			this.currentPage = outcome;
            var target = this.name;
            var _controller = this;
			var params = WindowUtil.getAllParameters();
			if( qrystr ) {
				var p = buildParamFromStr( qrystr );
				params = $.extend(params,p);
			}
			
			$('#'+target).load( this.pages[outcome], params, function() { 
                if( _controller.code.onpageload != null ) _controller.code.onpageload(outcome);
                _controller.refresh(); 
            } );
        }
    }
	
	function buildParamFromStr( str ) {
		var vars = {}, hash;
		var hashes = str.split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars[hash[0]] = hash[1];
		}
		return vars;
	}

    this.validate = function( selector ) {
        var errs = [];
		var errElems = [];
        var code = this.code;
		var name = this.name;
		var selector;
		if( this.container && this.container.element ) selector = this.container.element;
        $('select,input,textarea', selector || document).filter(
            function() {
                var o = $(this);
                if( o.is(':hidden') ) return;
				if( R.attr(this, 'required') != 'true' ) return;
				if( R.attr(this, 'context') != name ) return;
                
				$(this).removeClass('error');
                var fldName = R.attr(this, 'name');
                var caption = fldName;
                if( R.attr(this, "caption") ) caption = R.attr(this, "caption");
                new RequiredValidator(fldName, caption, this ).validate( code, errs, errElems );
            }
        )
        if( errs.length > 0 ) {
			if(errElems) errElems[0].focus();
			$(errElems).addClass('error');
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
	
	this.focus = function(name) {
		var func = function() { $('[name="'+name+'"]').focus(); }
		setTimeout( func, 1 ); 
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

//******************************************************************************************************************
// configure input controls
//******************************************************************************************************************
BindingUtils.handlers.input_text = function(elem, controller, idx ) {
	BindingUtils.initInput(elem, controller, function(elem,controller) {
		var input = $(elem);
		if( R.attr(input, 'suggest') && input.autocomplete ) {
			var src = controller.get(R.attr(input, 'suggest'));
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
	var name = R.attr(elem, 'name');
	var items = R.attr(elem, 'items');
	var selectedItem = R.attr(elem, 'selectedItem');
	var selected = controller.get( name );
	
	if( items ) $(elem).empty();
	
	if(R.attr($(elem), "allowNull")!=null) {
		var txt = R.attr($(elem), "emptyText");
		if(txt==null) txt = "-";
		elem.options[0] = new Option(txt,"");
		i = 1;
	}
	
	if( items!=null && items!='') {
		var itemKey = R.attr($(elem), "itemKey");
		var itemLabel = R.attr($(elem), "itemLabel");
		var arr = controller.get(items);
		$(arr).each( function(idx,value) {
			var _key = value;
			if( itemKey != null ) _key = value[itemKey];
			var _label = value+'';
			if( itemLabel != null ) _label = value[itemLabel];

			var op = new Option(_label,_key+'');
			
			$(op).data('value', _key);
			$(op).data('object_value', value);
			elem.options[idx+i] = op;
			op.selected = (_key == selected);
		});
	}
	else if( elem.options.length > 0 ) {
		$(elem.options).each(function(i,option){
			option.selected = (option.value == selected);
		});
	}

	if( !$(elem).data('_binded') ) {
		$(elem).change(function(){
			var op = this.options[this.selectedIndex];
			var objval = $(op).data('value');
			if( name )
				$get(controller.name).set(name, objval? objval : op.value );
				
			objval = $(op).data('object_value');
			if( selectedItem )
				$get(controller.name).set(selectedItem, objval);
		})
		.data('_binded', true);
		
		//fire change after bind to set default value
		$(elem).change();
	}
}

BindingUtils.handlers.input_radio = function(elem, controller, idx ) {
	var name = R.attr(elem, 'name');
	var c = controller.get(name);

	//set the name of all input type="radio" having the same r:name value
	//so that it will be group by name
	$(elem).attr('name', name);
	
	var value = elem.value;
	var checked = (c==value) ? true :  false;
	if( checked )
		$(elem).attr('checked', 'checked');
	else
		$(elem).removeAttr('checked');

	elem.onchange = function () {
		if( this.checked ) {
			controller.set(name, this.value );
		}
	}
}

BindingUtils.handlers.input_checkbox = function(elem, controller, idx ) {
	var name = R.attr(elem, 'name');
	var c = controller.get(name);
	if( R.attr($(elem), "mode") == "set" ) {
		try {
			var checkedValue = R.attr($(elem), "checkedValue");

			if( c.find( function(o) { return (o==checkedValue ) } ) !=null) {
				elem.checked = true;
			}
			else {
				elem.checked = false;
			}
			elem.onclick = function () {
				var _list = $get(controller.name).get(name);
				var v = R.attr($(this),  "checkedValue" );
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
		var checkedValue = R.attr($(elem), "checkedValue");
		if( checkedValue !=null && checkedValue == c ) {
			isChecked = true;
		}
		else if( c == true || c == "true" ) {
			isChecked = true;
		}
		elem.checked = isChecked;
		elem.onclick = function () {
			var v = (R.attr($(this),  "checkedValue" )==null) ? true : R.attr($(this),  "checkedValue" );
			var uv = (R.attr($(this),  "uncheckedValue" )==null) ? false : R.attr($(this),  "uncheckedValue" );
			$get(controller.name).set(name, (this.checked) ? v : uv );
		}
	}
}

BindingUtils.handlers.input_button = function( elem, controller, idx ) {
    var action = R.attr(elem, "name");
    if(action==null || action == '') return;
    elem.onclick = function() { 
		$get(controller.name).invoke( this, action );  
	}
};

BindingUtils.handlers.a = function( elem, controller, idx ) {
	var $e = $(elem);
    var action = R.attr($e, "name");
    
    //add an href property if not specified,
    //css hover does not apply when no href is specified
    if( !$e.attr('href') ) $e.attr('href', '#');
    
    elem.onclick = function() { 
		if( action ) {
			try {
				$get(controller.name).invoke( this, action ); 
			}
			catch(e) {
				if( window.console && R.DEBUG ) console.log( e.message );	
			}
		}
		return false; 
	}
}

BindingUtils.handlers.button = function( elem, controller, idx ) {
	var $e = $(elem);
    var action = R.attr($e, "name");
    
    elem.onclick = function() { 
		if( action ) {
			try {
				$get(controller.name).invoke( this, action ); 
			}
			catch(e) {
				if( window.console && R.DEBUG ) console.log( e.message );	
			}
		}
		return false; 
	}
}

BindingUtils.handlers.input_submit = function( elem, controller, idx ) {
    var action = R.attr(elem, "name");
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
	BindingUtils.bind( null, lbl );
};

BindingUtils.handlers.div = function( elem, controller, idx ){
	var div = $(elem);
	var ctx = $ctx(controller.name);
	var panelName = R.attr(div, "name");
	if(panelName!=null) {
		
		var o = controller.get( R.attr(div, 'name') );
		var parms = WindowUtil.getAllParameters();
		if( typeof o == "string" ) {
			div.load( o, parms );
		}
		else if( o.classname == "opener" ) {
			if(o.params) {
				for( var n in o.params ) {
					parms[n] = o.params[n];
				}
			}
			div.load( o.page, parms );			
		}
	}	
};


/**----------------------------------*
 * file upload plugin
 *
 * @author jaycverg
 *-----------------------------------*/
BindingUtils.handlers.input_file = function( elem, controller, idx ) {
	
	var infile = $(elem);
	var div = infile.data('_binded');
	
	if( !div ) {
		div = $('<div></div>').insertBefore(elem)
		 .css('display', 'block').addClass('file-uploader');
		infile.data('_binded', div);
	};

	div.empty();

	//hide the original input file
	infile.hide().css('opacity', 0);

	//-- properties/callbacks
	var oncomplete = R.attr(infile, 'oncomplete');
	var onremove =   R.attr(infile, 'onremove');
	var labelExpr =  R.attr(infile, 'expression');
	var name =       R.attr(infile, 'name');
	var fieldValue = controller.get(name);
	
	var multiFile =  fieldValue instanceof Array;

	//upload box design
	var listBox =       $('<div class="files"></div>').appendTo(div);
	var inputWrapper =  $('<div style="overflow: hidden; position: absolute;"></div>');
	var anchorLbl =     $('<a href="#">' + R.attr(infile, 'caption') + '</a>');
	var anchorBox =     $('<div class="selector" style="position: relative"></div>');
	var lblWidth =  0;

	if( fieldValue ) {
		var items = multiFile? fieldValue : [fieldValue];
		for(var i=0; i<items.length; ++i) addToFileList(null,null,null,null,items[i]);
	}
	
	if( multiFile || !fieldValue ) {
		anchorBox.appendTo( div )
		.append( anchorLbl )
		.append( inputWrapper );
		
		lblWidth = anchorLbl[0].offsetWidth;
		inputWrapper.css({left: 0, top: 0, width: lblWidth});
		
		attachInput();
	}
	
	
	function attachInput() {
		var input = $('<input type="file" name="file"/>');
		input.appendTo( inputWrapper )
		 .change(file_change)
		 .css({
			position:'relative', opacity: 0, cursor: 'pointer', 
			left: -(input[0].offsetWidth - lblWidth)
		 });
	}

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

		if( multiFile ) 
			attachInput();
		else
			anchorBox.hide();
		
		form.submit();
	}
	
	function getCaption( value ) {
		return value? 
		        (cap = labelExpr? labelExpr.evaluate(value) : $.toJSON(value)) : 
		        'No Caption';
	}

	function frame_loaded(frame) {
		var value = null;
		var lbl = frame.parent().find('div.label')

		var resptext = frame.contents().text();
		try {
			value = $.parseJSON(resptext);
		}catch(e){
			alert( resptext );
			controller.refresh();
			return;
		}

		if( name ) {
			if( multiFile )
				controller.get(name).push(value);
			else
				controller.set(name, value);
		}
		lbl.html( getCaption(value) );
		
		if( oncomplete ) 
			BeanUtils.invokeMethod( controller.code, oncomplete, value, true );

		if( onremove ) {
			$('<a href="#" class="remove">Remove</a>')
			 .appendTo( lbl )
			 .click(function(){
				var res = BeanUtils.invokeMethod( controller.code, onremove, {index: frame.parent().index(), value: value}, true );
				if( res == false || res == 'false' ) return;
				frame.parent().animate({opacity: 0}, {duration:400, complete:function(){ $(this).remove(); }});
			 });
		}
	}

	function addToFileList(frame, form, pBar, input, value) {
		var b = $.browser;

		//decorate progress bar
		if( pBar && frame ) {
			pBar.find('div.progress')
			.addClass( b.msie? '' : b.webkit? 'webk' : 'moz' )
			.attr('id', frame.attr('id') + '_progress');
		}

		//create the file item box
		var fibox = $('<div class="file"></div>').appendTo( listBox );
		if( frame ) fibox.append( frame );
		if( form )  fibox.append( form );
		fibox.append('<div class="label">' + getCaption( value ) + '</div>')
		if( pBar )  fibox.append( pBar );
	}

	function createFrame( id ) {
		return $('<iframe src="" id="'+id+'" name="'+id+'"></iframe>').hide();
	}

	function createForm( target, input ) {
		return $('<form method="post" enctype="multipart/form-data"></form>')
			    .attr({ 'target': target, 'action': R.attr(infile, 'url') })
			    .append( input )
			    .append( '<input type="hidden" name="file_id" value="' +target+ '"/>' )
			    .hide();
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
				url: R.attr(infile, 'url'),
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

	var multiselect = R.attr(table, 'multiselect') == 'true';
	var varStat =     R.attr(table, 'varStatus');
	var varName =     R.attr(table, 'varName');
	var name =        R.attr(table, 'name');

	if( R.attr(table, 'items') ) {
		model.setList( controller.get(R.attr(table, 'items')) );
	}
	if( R.attr(table, 'model') ) {
		model.setDataModel( controller.get(R.attr(table, 'model')) );
		table.data('_has_model', true);
	}

	var status = {prevItem: null, nextItem: null};
	var tbody = table.find('tbody');

	var tpl = table.data('template');
	if( !tpl ) {
		tpl = tbody.find('tr').remove().clone(true);
		table.data('template', tpl);
	}

	model.onRefresh = doRender;
	model.onAppend = function(list, type, animate) { 
		renderItemsAdded(list, type, animate, true);
	};
	model.load();

	var tabIdx;

	function doRender() {
		tbody.hide().empty();
		tabIdx = table.data('index');
		status.index = 0;
		
		var list = model.getList();
		if(list==null) list = [];
		
		var items = renderItemsAdded( list, null, false );
		$(items).each(function(i,e){ td_mousedown(e, true); });
		tbody.show();
		BindingUtils.bind( null, table );
	}
	
	function renderItemsAdded( list, type, animate, bindItems ) {
		animate = (animate!=null)? animate : true;
		var selected = name? controller.get(name) : null;
		var selectedTds = [];
		var appendtype = type? type : R.attr(table, 'appendtype');

		//render the rows
		var rows = [];
		for(var i=0; i<list.length; ++i) {
			var item = list[i];
			status.prevItem = (i > 0)? list[i-1] : null;
			status.nextItem = (i < list.length-1)? list[i+1] : null;

			var row = createRow(i, item);
			rows.push( row );
			if( animate ) row.css('opacity', 0).animate({opacity: 1});
			if( selected == item ) {
				var pos = table.data('selected_position');
				var td = pos ? $(row[pos.row]).find('td')[pos.col] : row.find('td:first:not([r\\:selectable])')[0];
				selectedTds.push( td )
			};
			status.index++;
		};
		
		if( appendtype == 'before' )
			$(rows).prependTo(tbody);
		else
			$(rows).appendTo(tbody);

		var rows = model.getRows();
		if( rows != -1 && list.length < rows ) {
			//add extra rows if the items size is less than the no. of rows
			for(var i=list.length; i<rows; ++i ) {
				createRow(i, null).appendTo( tbody );
				status.index++;
			}
		}
		
		if( bindItems ) BindingUtils.bind( rows );
		
		return selectedTds;
	}

	function createRow(i, item) {
		return tpl.clone()
		 .data('index', i)
		 .each(function(i,e)
		  {
			var tr = $(e);
			var origTr = $(tpl[i]);

			evalAttr(origTr[0],e,item);
			if( R.attr($(e), 'visibleWhen') ) {
				var visible = R.attr($(e), 'visibleWhen').evaluate( function(n) { return resolve(n, item); } );
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
					if( R.attr(td, 'name') )
						value = resolve( R.attr(td, 'name'), item );
					else if ( R.attr(td, 'expression') )
						value = R.attr(td, 'expression').evaluate(  function(n) { return resolve(n, item); }  );
					else
						value = unescape(td.html()).evaluate(  function(n) { return resolve(n, item); }  );

					td.html( value? value+'' : '&nbsp;' );
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

		if( R.attr(td, 'selectable') == 'false' ) return;
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
			controller.set( name, multiselect? model.getSelectedItems() : model.getSelectedItem() );	
			
			//keep the selected td index to the table element
			table.data('selected_position', td.data('position'));
		}
	}
	
	function td_mouseover() {
		if( R.attr($(this), 'selectable') == 'false' ) return;
		
		$(this).addClass('hover')
		 .parent().addClass('hover');
	}
	
	function td_mouseout() {
		if( R.attr($(this), 'selectable') == 'false' ) return;
		
		$(this).removeClass('hover')
		 .parent().removeClass('hover');
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
				R.attr($(cloneElem), attrName, attrValue);
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
			if( window.console && R.DEBUG ) console.log( e.message );
		}
		return null;
	}

} //-- end of DataTable class


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
	_this.onAppend;

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
	
	_this.getSelectedItem = function() {
		var len = _selectedItems.length;
		return len > 0? _selectedItems[len-1] : null;
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
	
	function fetchNext() {
		if( _dataModel && $.isFunction( _dataModel.fetchList ) ) {
			var last = _list? _list[ _list.length-1 ] : null;
			var result = _dataModel.fetchList({}, last);
			if( result ) {
				if( $.isFunction( _this.onAppend ) ) {
					_this.getList().addAll( result );
					_this.onAppend( result );
				}
			}
		}
	}
	
	function moveFirst() {
		_listParam._start = 0;
		doRefresh(true);
	}
	
	function moveNext() {
		if( _listParam && !_isLast ) {
			_listParam._start += _listParam._limit-1;
		}
		doRefresh(true);
	}
	
	function movePrev() {
		if( _listParam && _listParam._start > 0 ) {
			_listParam._start -= _listParam._limit-1;
		}
		doRefresh(true);
	}
	
	function appendItem( item ) {
		appendAll( [item] );
	}
	
	function appendAll( list ) {
		if( !list ) return;
		if( $.isFunction( _this.onAppend ) ) {
			_this.getList().addAll( list );
			_this.onAppend( list, 'after' );
		}
	}
	
	function prependItem( item ) {
		prependAll( [item] );
	}
	
	function prependAll( list ) {
		if( !list ) return;
		if( $.isFunction( _this.onAppend ) ) {
			_this.getList();
			_list = list.concat( _list );
			_this.onAppend( list, 'before' );
		}
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

		_dataModel.setList = _this.setList;
		_dataModel.load = _this.load;
		_dataModel.fetchNext = fetchNext;
		_dataModel.refresh = doRefresh;
		_dataModel.moveFirst = moveFirst;
		_dataModel.moveNext = moveNext;
		_dataModel.movePrev = movePrev;
		_dataModel.appendItem = appendItem;
		_dataModel.appendAll = appendAll;
		_dataModel.prependItem = prependItem;
		_dataModel.prependAll = prependAll;

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

/**
 *  <OL> and <UL> plugin
 *    @author  jaycverg
 */

(function(){

	BindingUtils.handlers.ol = renderer;
	BindingUtils.handlers.ul = renderer;
	
	//shared renderer
	function renderer( elem, controller, idx ) {
		var $e = $(elem);
		if( !R.attr($e, 'items') ) return;
		
		var tpl = $e.data('___template');
		if( !tpl && !$e.data('___binded') ) {
			tpl = $e.html();
			$e.data('___template', tpl);
			$e.data('___binded', true);
		}

		var selected;
		if( R.attr($e, 'name') ) selected = controller.get( R.attr($e, 'name') );
		
		var varName = R.attr($e, 'varName');
		var varStat = R.attr($e, 'varStatus');
		var status = { index: 0 };
		
		$e.empty();
		$(controller.get(R.attr($e, 'items'))).each(function(i,o){
			var li;
			if( tpl ) {
				var html = tpl;
				li = $( (html+'').evaluate( function(n) { return resolve(n, o); } ) );
			}
			else {
				li = $( '<li>' + o + '</li>' );
			}
			
			if( o == selected ) li.addClass('selected');
			
			li.data('value', o);
			$e.append( li );
			
			status.index++;
		});
		
		if( R.attr($e, 'name') ) {
			$e.find('li').mousedown(function(){
				controller.set(R.attr($e, 'name'), $(this).data('value'));
				$e.find('li').removeClass('selected');
				$(this).addClass('selected');
			});
		}
		
		if( tpl ) {
			BindingUtils.bind( null, $e );
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
						_ctx = controller.code;
					}
				}

				return BeanUtils.getProperty( _ctx, name );
			}
			catch(e) {
				if( window.console && R.DEBUG ) console.log( e.message );
			}
			return null;
		}
	}

})();

//-- end of <OL> and <UL> plugin

/**
 *  template tag plugin
 *    @author  jaycverg
 */
BindingUtils.handlers.template = function(elem, controller, idx) {
	var tag = $(elem);
	var div = $(tag).next('div.template');
	if( div.length == 0 ) {
		div = $('<div class="template"></div>').insertAfter(tag);
	}
	
	var p = {};
	var pjson = R.attr(tag, 'params');
	if( pjson ) {
		try{  p = eval('(' + pjson + ')'); }
		catch(e) {
			if( window.console ) console.log('Template params error: ' + e.message);
		}				
	}
	window.params = p;
	
	if( div.children().length == 0 ) {
		var tpl = $('div#' + R.attr(tag,'id'));
		div.empty().append( tpl.clone(true).show().removeAttr('id') );
		BindingUtils.bind( null, div );
	}
};
//-- end of <template> tag plugin --


var WindowUtil = new function() {
	this.load = function( page, args, hash ) {
		var qry = "";
		if(args!=null ) {
			qry = "?" + this.stringifyParams( args );
		}
		if( hash!=null ) {
			qry = qry + "#" + hash;
		}
		window.location = page + qry;
    }

	this.reload = function(args, hash) {
		var qry = "";
		if(args!=null ) {
			qry = "?" + this.stringifyParams( args );
		}
		if( hash!=null ) {
			qry = qry + "#" + hash;
		}
		if(qry.startsWith("#")) 
			window.location = qry;
		else	
			window.location.search = qry;
	}
	
	this.stringifyParams = function( args ) {
		var qry = "";
		for(var k in args) {
			if(qry!="") qry += "&";
			qry += k+"="+escape( args[k] );
		}
		return qry;
	}

	
	
	//this is to be deprecated just in case there is something referencing this
	this.loadOld = function( page, target, options ) {
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

	this.getParameters = function(qryParams) {
		var params = this.parseParameters( window.location.href.slice(window.location.href.indexOf('?') + 1) );
		if( qryParams !=null ) {
			for(var n in qryParams ) {
				if( (typeof qryParams[n] != "function") && (typeof qryParams[n]!="object") ) {
					params[n] = qryParams[n];
				}
			}
		}
		return params;
	}
	
	//this will retrieve all parameters including hidden parameters.
	this.getAllParameters = function(selector) {
		var f = this.getParameters();
		if(f==null) f = {};
		if( selector ) {
			$("input[type='hidden'][context!='']", selector).each(function(i,elm){
				var name = R.attr(elm, 'name');
				if( name ) {
					f[name] = $get(R.attr($(elm), 'context')).get( name );
				}
			});
		}
		return f;
	}
	
	this.parseParameters = function( str ) {
		var vars = {}, hash;
		var hashes = str.split('&');
		for(var i = 0; i < hashes.length; i++)
		{
			hash = hashes[i].split('=');
			vars[hash[0]] = this.getParameter(hash[0]);
		}
		return vars;
	}
	
	this.buildHash = function(hash, params) {
		if(params==null) return hash;
		return hash + "?" + this.stringifyParams(params);
	}
	
	this.loadHash = function(hashid, params ) {
		this.reload( null, this.buildHash(hashid, params) );
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

var Registry = new function() {

    this.invokers = [];
	var index = {}

	this.add = function( o ) {
		this.invokers.push( o );
		if(o.id) index[o.id] = o;	
	}
	
	this.lookup = function( typename ) {
		return this.invokers.findAll(  function(o) {  return o.type == typename }  );
	}	
	
	this.find = function(id) {
		return index[id];
	}
	
};

var Hash = new function() {

	var self = this;
	this.target = "content";
	
	this.handlers = {}
	
	this.init = function() {
		$(window).bind( "hashchange", function() {
			self.loadContent();
		});
		if( window.location.hash ) {
			self.loadContent();
		}
	}
	
	this.navigate = function( id, params ) {
		var hash = id;
		if(params!=null) {
			hash = hash + "?" + WindowUtil.stringifyParams( params );
		}
		window.location.hash = hash;
	}
	
	this.reload = function( params ) {
		var hash = window.location.hash.substring(1);
		if( hash.indexOf("?") > 0 ) {
			hash = hash.split("?")[0];
		}
		if(params!=null) {
			hash = hash + "?" + WindowUtil.stringifyParams( params );
		}
		window.location.hash = hash;
	}
	
	
	this.loadContent = function() {
		var hash = window.location.hash.substring(1);
		var params = null;
		if( hash.indexOf("?") > 0 ) {
			hash = hash.split("?");
			params = WindowUtil.parseParameters( hash[1] );
			hash = hash[0];
		}
		if(hash=="") return;
		var inv = Registry.find(hash);
		if(inv==null)
			throw new Error("hash " + hash + " is not registered" );
		if( !inv.page) return;	

		//store all params in query parameters to be sent to the server
		var qryParams = WindowUtil.getAllParameters();
		for(var n in params) {
			qryParams[n] = params[n];	
		}
		
		//load the page into the target content
		var content = $('#'+this.target);
		content.load(inv.page, qryParams, function() {
			//attach the bookmark;
			$get(inv.context).bookmark = self;
			if(params!=null) {
				for( var key in params ) {
					try{ $ctx(inv.context)[key] = params[key]; }catch(e){;}
				}
			}
			if( inv.parent ) {
				$get(inv.context).container = {
					close :  function() { self.navigate(inv.parent); },
					refresh: function() { $get(inv.context).refresh(); },
					reload : function() { self.reload(); }
				}
			}
			else {
				$get(inv.context).container = {
					close :  function() { },
					refresh: function() {$get(inv.context).refresh(); },
					reload : function() { self.reload(); }
				}
			}

			BindingUtils.load( content );
		});
		
		//pass the registered object (based on hashkey) and the parameters passed
		for(var n in this.handlers ) {
			this.handlers[n](inv, params);
		}
	}
}

//OPENERS
//******************************************************************************************************************
// type of openers...
//req. Opener must have an interface
//  classname = 'opener'
//  load();
//******************************************************************************************************************
//basic Opener

function Opener(id, params) {
	this.classname = "opener";
	this.id = id;
	this.params = params;
	if( id.indexOf(".")>0) {
		this.page = id;
	}
	else {
		var inv = Registry.find(id);
		this.page = inv.page;
	}
}


/**
 * This is the opener used to open a popup dialog
 * You can set global options using:
 *   PopupOpener.options = {}
 * the value of PopupOpener.options is global unless explicitly overriden
 */
function PopupOpener( id, params, options ) 
{
    this.classname = "opener";
	this.id = id;
    this.params = params;
	this.caller;
	this.parentTarget;
	this.title;
	this.source;
	this.options = options || {};

	var defaultOptions = {show: 'fade', hide: 'fade', height: 'auto'};
	
	//merge values of PopupOpener.options if specified
	if( PopupOpener.options )
		defaultOptions = $.extend(defaultOptions, PopupOpener.options);


    this.load = function() {
		var inv = Registry.find(this.id);
		if(inv==null) {
			alert( this.id + " is not registered" );
			return;
		}
        var n = inv.context;
		var page = inv.page;
        var p = this.params;
		var caller = this.caller;

		var dynamic = !this.id.startsWith('#');
		var	div;
		if( dynamic )
			div = $('<div></div>').appendTo('body');
		else
			div = $(this.id);

		//remove div if dynamically created
		if( dynamic ) {
			this.options.close = function() { div.remove();	}
		}
		this.options.modal = true;
		this.options.title = this.title || inv.title;

		var options = $.extend(defaultOptions, this.options);
		if( inv.options ) options = $.extend(options, inv.options);

		if( dynamic )
			div.load(page, WindowUtil.getParameters(p), createDialog);
		else
			createDialog();
		
		function createDialog() {
			try {
				if(p!=null) {
					for( var key in p ) {
						try{ $ctx(n)[key] = p[key]; }catch(e){;}
					}
				}
				$get(n).container = {
					element: div,
					close: function() { div.dialog("close"); if(caller) caller.refresh(); },
					refresh: function() { $get(n).refresh(); }
				};	
			}
			catch(e) {;}
            BindingUtils.load( div );
            //make into a dialog after the content is loaded.
            div.dialog(options);
		}
    }
}


/**
 * DropdownOpener class
 *
 * This is the opener used to open a dropdown window
 * You can set global options using:
 *   DropdownOpener.options = {}
 * the value of DropdownOpener.options is global unless explicitly overriden
 */
function DropdownOpener( id, params ) 
{
	this.classname = "opener";
	this.caller;
    this.id = id;
    this.params = params;
	this.title;
	this.source;
	this.options = {};
	this.styleClass;
	
	var defaultConfig = { my: 'left top', at: 'left bottom' };
	
	
    this.load = function() {
		var inv = Registry.find(this.id);
		if(inv==null) {
			alert( this.id + " is not registered" );
			return;
		}
        var n = inv.context;
        var p = this.params;
		var caller = this.caller;
		var page;
		if( this.id.startsWith('#') )
			page = $(this.id);
		else
			page = inv.page;
		
		if( DropdownOpener.options ) this.options = $.extend(DropdownOpener.options, this.options);
		if( inv.options ) this.options = $.extend(this.options, inv.options);
		
		var w = new DropdownWindow(this.source, this.options, this.styleClass);
        w.show( page, WindowUtil.getParameters(p), function(div) {
			if( n!=null ) {
				if(p!=null) {
					for( var key in p ) {
						try{ $ctx(n)[key] = p[key]; }catch(e){;}
					}
				}
				BindingUtils.load( div );
				$get(n).container = {
					element: w.getElement(),
					close:   function() { w.close(); if(caller) caller.refresh() },
					refresh: function() { $get(n).refresh(); }
				}
			}
        });
    };


	//--- DropdownWindow class ----
	function DropdownWindow( source, options, styleClass ) {

		var div = $('<div class="dropdown-window" style="position: absolute; z-index: 200000; top: 0; left: 0;"></div>');
		var dynamic = false;
		
		if( styleClass ) div.addClass( styleClass );

		this.show = function( page, params, callback ) {
			var posConfig = $.extend(defaultConfig, options.position || {});
			posConfig.of = $(source);
			
			dynamic = (typeof page == 'string');
			
			if( isFixedPositioned( posConfig.of ) )
				div.css('position', 'fixed');
			
			if( dynamic ) {
				div.hide().load( page, params, initDailog);
			}
			else {
				page.show();
				div.append(page);
				initDailog();
			}				
			
			function initDailog(){
				div.appendTo('body')
				 .position( posConfig )
				 .show('slide', {direction:"up"});

				bindWindowEvt();
				callback(div);
				if( options.onShow ) options.onShow( div );
			}
		};
		
		this.getElement = function() { return div; }

		this.close = function() { hide(); };
		
		function isFixedPositioned( elem ) {
			return elem.css('position') == 'fixed' || 
			      (elem[0].offsetParent && isFixedPositioned( $(elem[0].offsetParent) ));
		}

		function hide() {
			div.hide('slide', {direction:"up"}, function() {
				if( !dynamic ) {
					var ch = $(this).children().hide().remove();
					ch.insertAfter(this);
				}
				$(this).remove(); 
				if( options.onClose ) options.onClose( this );
			});
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

//load binding immediately
$(document).ready (
    function() {
        BindingUtils.load();
		Hash.init();
		Scroller.init();
    }
);

//important keyword shortcuts used by the programmer
function $get( name ) { return ContextManager.get(name); };
function $put( name, code, pages ) {return ContextManager.create( name, code, pages );};
function $ctx(name) {return ContextManager.get(name).code;};
function $load(func) {  BindingUtils.loaders.push(func); };
function $register( config ) { Registry.add(config); };

//scroller manager
var Scroller = new function(){

	var globalListners = []; //array
	var localListeners = {}; //map of id(hashid) and listener array pair
	
	this.init = function() {
		$(function(){
			$(window).scroll(function() {
				if  ($(window).scrollTop() == $(document).height() - $(window).height()){
				   Scroller.onScrollToBottom();
				}
			});
		});
	}

	/**
	 * @param listener
	 *		the callback function
	 * @param hashid
	 *		optional, if you pass an id(hashid), the listener will be treated as a local listener for a particular hashid
	 */
	this.register = function( listener, hashid ) {
		if( !hashid ) {
			if( $.inArray( listener, globalListners ) >= 0 ) return;
			globalListners.push( listener );
		}
		else {
			if( !(localListeners[hashid] instanceof Array) )
				localListeners[hashid] = [];

			if( $.inArray( listener, localListeners[hashid] ) >= 0 ) return;
			localListeners[hashid].push(listener);
		}
	}
	
	/**
	 * @param listener 
	 *		if no hashid passed, it will look for the listener passed on the globalListners and removes it
	 * @param hashid
	 *		optional, if a hashid is passed, it will look for the listener passed on the localListeners and removes it
	 */
	this.unregister = function( listener, hashid ) {
		if( !hashid ) {
			globalListners.remove( listener );
		}
		else {
			if( localListeners[hashid] ) localListeners[hashid].remove( listener );
		}
	}
	
	this.onScrollToBottom = function() {
		for(var i=0; i<globalListners.length; ++i) globalListners[i]();
		
		var currentHash = location.hash.length > 1 ? location.hash.substring(1) : '';
		if( !currentHash ) return;
		
		for(var i in localListeners) {
			if( i != currentHash ) continue;
			if( localListeners[i] && localListeners[i].length == 0 ) continue;
			for(var j=0; j<localListeners[i].length; ++j) {
				localListeners[i][j]();
			}
		}
	}
	
};
