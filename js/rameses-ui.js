/***
    Rameses UI library
	depends: rameses-extension library
**/

var BindingUtils = new function() {
    //loads all controls and binds it to the context object

    this.handlers = {};
    this.loaders = [];
    this.input_attributes = [];

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
			
			if( $e.attr('action') ) {
				var action = $e.attr('action');
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
		var contextName = div.getAttribute('controller');
		if(div.id==null || div.id=='') div.id = contextName;
		var controller = $get(contextName);
		if( controller != null ) {
			if( controller.name == null ) controller.name = contextName;
			if( div.getAttribute("loadAction")!=null) controller.loadAction = div.getAttribute("loadAction");
			controller.load();
		}
	};

    this.bind = function(ctxName, selector) {
		//just bind all elements that has the attribute context
        $("[context][context!='']", selector? selector : null).each ( controlLoader );
    };

    this.loadViews = function(ctxName, selector) {
		//var predicate = (ctxName!=null && ctxName!="") ? "[context][context='"+ctxName+"']" : "[context][context!='']";
        //loads all divs with context and displays the page into the div.
        $('div[controller][controller!=""]', selector? selector : null).each ( containerLoader );
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
        //$(this.input_attributes).each(
        //    function(idx,func) { func(elem, controller); }
        //)
    };

	this.notifyDependents = function(dependName, selector) {
		var predicate = "[depends*='"+dependName+"'][context!='']";
		$(predicate, selector).each( controlLoader );
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

		input.keyup(input_keyup)
		 .keypress(input_keypress)
		 .focus(input_focus)
		 .blur(input_blur)
		 .data('hint_decorator', this);

		var span = $('<span class="hint" style="position:absolute; z-index:100; overflow: hidden;"></span>')
		 .html( input.attr('hint') )
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

		function refresh(){
			if( !input.val() )
				showHint();
			else
				hideHint();
		}

		var isPositioned;

		function position() {
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
						
			span.css( css );
			isPositioned = true;
		}

		function showHint() {
			span.css('width', input.width()).show();
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
        if(this.name!=null) BindingUtils.bind( this.name )
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
				
				/*added support for parameters that are set when firing a button or action.*/
				if( $(control).attr("params") ) {
					try {
						var _parms  = $.parseJSON($(control).attr('params'));
						BeanUtils.setProperties( this.code, _parms );
					}
					catch(e) {
						if(window.console) console.log("error in control params " + e.message );
					}
				}
				
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
			//intended only for <div context="name"></div>
			if( outcome == null ) outcome = "default";
            if(outcome.startsWith("_")) outcome = outcome.substring(1);
			this.currentPage = outcome;
            var target = this.name;
            var _controller = this;
            $('#'+target).load( this.pages[outcome], WindowUtil.getAllParameters(), function() { 
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

//load binding immediately
$(document).ready (
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
	BindingUtils.bind( null, lbl );
};

BindingUtils.handlers.div = function( elem, controller, idx ){
	var div = $(elem);
	var ctx = $ctx(controller.name);
	var panelName = div.attr("name");
	if(panelName!=null) {
		
		var o = controller.get( div.attr('name') );
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
	var oncomplete = infile.attr('oncomplete');
	var onremove =   infile.attr('onremove');
	var labelExpr =  infile.attr('expression');
	var name =       infile.attr('name');
	var fieldValue = controller.get(name);
	
	var multiFile =  fieldValue instanceof Array;

	//upload box design
	var listBox =       $('<div class="files"></div>').appendTo(div);
	var inputWrapper =  $('<div style="overflow: hidden; position: absolute;"></div>');
	var anchorLbl =     $('<a href="#">' + infile.attr('caption') + '</a>');
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
			    .attr({ 'target': target, 'action': infile.attr('url') })
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
				url: infile.attr('url'),
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

	model.onRefresh = doRender;
	model.onAppend = renderItemsAdded;
	model.load();

	var tabIdx;

	function doRender() {
		tbody.hide().empty();
		tabIdx = table.data('index');
		status.index = 0;
		
		var list = model.getList();
		if(list==null) list = [];
		
		var items = renderItemsAdded( list, false );
		$(items).each(function(i,e){ td_mousedown(e, true); });
		tbody.show();
		BindingUtils.bind( null, table );
	}
	
	function renderItemsAdded( list, animate ) {
		animate = (animate!=null)? animate : true;
		var selected = name? controller.get(name) : null;
		var selectedTds = [];

		//render the rows
		for(var i=0; i<list.length; ++i) {
			var item = list[i];
			status.prevItem = (i > 0)? list[i-1] : null;
			status.nextItem = (i < list.length-1)? list[i+1] : null;

			var row = createRow(i, item).appendTo( tbody );
			if( animate ) row.hide().fadeIn('slow');
			if( selected == item ) {
				var pos = table.data('selected_position');
				var td = pos ? $(row[pos.row]).find('td')[pos.col] : row.find('td:first:not([selectable])')[0];
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
		if( $(this).attr('selectable') == 'false' ) return;
		
		$(this).addClass('hover')
		 .parent().addClass('hover');
	}
	
	function td_mouseout() {
		if( $(this).attr('selectable') == 'false' ) return;
		
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
			var result = _dataModel.fetchList({});
			if( typeof result != 'undefined' ) {
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
 *    @author  jaycvergS
 */

(function(){

	BindingUtils.handlers.ol = renderer;
	BindingUtils.handlers.ul = renderer;
	
	//shared renderer
	function renderer( elem, controller, idx ) {
		var $e = $(elem);
		if( !$e.attr('items') ) return;
		
		var tpl = $e.data('___template');
		if( !tpl && !$e.data('___binded') ) {
			tpl = $e.html();
			$e.data('___template', tpl);
			$e.data('___binded', true);
		}
		
		var selected;
		if( $e.attr('name') ) selected = controller.get( $e.attr('name') );
		
		var varName = $e.attr('varName');
		var varStat = $e.attr('varStatus');
		var status = { index: 0 };
		
		$e.empty();
		$(controller.get($e.attr('items'))).each(function(i,o){
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
		
		if( $e.attr('name') ) {
			$e.find('li').mousedown(function(){
				controller.set($e.attr('name'), $(this).data('value'));
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
				if( window.console ) console.log( e.message );
			}
			return null;
		}
	}

})();

//-- end of <OL> and <UL> plugin


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

	this.getParameters = function(qryParams){
		var params = this.parseParameters( window.location.href.slice(window.location.href.indexOf('?') + 1) );
		if( qryParams !=null ) {
			for(var n in qryParams ) {
				params[n] = qryParams[n];
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
				if( elm.name ) {
					f[elm.name] = $get($(elm).attr('context')).get( elm.name );
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

function DocOpener( id, params, qp ) {
	
	this.classname = "opener";
    this.caller;
	this.source;
	
	this.id = id;
	this.params = params;
	this.qryParams = qp;

	this.load = function() {
		Hash.navigate( this.id, this.params );
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


function PopupOpener( id, params, qp ) {

    this.classname = "opener";
	this.id = id;
    this.params = params;
	this.caller;
	this.parentTarget;
	this.title;
	this.source;
	this.options = {};
	this.qryParams = qp;

	var defaultOptions = {show: 'fade', hide: 'fade', height: 'auto'};

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
		
        var id = 'popup_' + Math.floor( Math.random() * 200000 );
        var	div = $('<div id="' + id + '"></div>').appendTo('body');

		//remove div if dynamically created
		this.options.close = function() { div.remove();	}
		this.options.modal = true;
		this.options.title = this.title || inv.title;

		var options = $.extend(defaultOptions, this.options);
		if( inv.options ) options = $.extend(options, inv.options);

        div.load(page, WindowUtil.getParameters(this.qryParams), function() {
			try {
				if(p!=null) {
					for( var key in p ) {
						try{ $ctx(n)[key] = p[key]; }catch(e){;}
					}
				}
				$get(n).container = {
					close: function() { div.dialog("close"); if(caller) caller.refresh(); },
					refresh: function() { $get(n).refresh(); }
				};	
			}
			catch(e) {;}
            BindingUtils.load( div);
            //make into a dialog after the content is loaded.
            div.dialog(options);
        });
    }
}

//-- DropdownOpener class
function DropdownOpener( id, params, qry ) {
	this.classname = "opener";
	this.caller;
    this.id = id;
    this.params = params;
	this.title;
	this.source;
	this.options = {};
	this.styleClass;
	this.qryParams = qry;

    this.load = function() {
		var inv = Registry.find(this.id);
		if(inv==null) {
			alert( this.id + " is not registered" );
			return;
		}
        var n = inv.context;
        var p = this.params;
		var page = inv.page;
		var caller = this.caller;
		
		if( inv.options ) this.options = $.extend(this.options, inv.options);
		
		var w = new DropdownWindow(this.source, this.options, this.styleClass);
        w.show( page, WindowUtil.getParameters(this.qryParams), function(div) {
			if( n!=null ) {
				if(p!=null) {
					for( var key in p ) {
						try{ $ctx(n)[key] = p[key]; }catch(e){;}
					}
				}
				BindingUtils.load( div );
				$get(n).container = { 
					close:   function() { w.close(); if(caller) caller.refresh() },
					refresh: function() { $get(n).refresh(); }
				}
			}
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

			div.hide().load( page, params, function(){
				div.appendTo('body')
				 .position( posConfig )
				 .show('slide', {direction:"up"});

				bindWindowEvt();
				callback(div);
			});
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
