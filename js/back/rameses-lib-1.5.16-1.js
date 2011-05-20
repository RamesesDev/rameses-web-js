/*** 
    version 1.5.16-1
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
    return str; 
     
    //-- helper methods 
    function defaultHandler(name) { 
        return BeanUtils.getProperty( ctx, name ); 
    } 
 
    function _evaluate(str) { 
        var match = str.match(/[a-zA-Z_\$]+[a-zA-Z_\$\d\.]+|'[^']+'|"[^"]+"/g); 
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
 
function DynamicProxy( context ) { 
    this.context = context; 
    this.create = function( svcName ) { 
        return new _DynamicProxyService( svcName, this.context );     
    } 
} 
 
 
var BindingUtils = new function() { 
    //loads all controls and binds it to the context object 
     
    this.handlers = {} 
    this.loaders = []; 
    this.input_attributes = []; 
     
	var controlLoader =  function(idx, elem) { 
	    var _self = BindingUtils; 
		var contextName = $(elem).attr( 'context' ); 
        var controller = $get(contextName); 
        if( controller != null ) { 
			if( controller.name == null ) controller.name = contextName; 
            var n = elem.tagName.toLowerCase() 
            if(n == "input") n = n + "_" + elem.type ; 
			if( _self.handlers[n] ) _self.handlers[n]( elem, controller, idx );      
        } 
    } 
	 
	var containerLoader = function(idx, div ) {
		var contextName = div.getAttribute('context'); 
		if(div.id==null || div.id=='') div.id = contextName; 
		var controller = $get(contextName); 
		if( controller != null ) { 
			if( controller.name == null ) controller.name = contextName; 
			if( div.getAttribute("loadAction")!=null) controller.loadAction = div.getAttribute("loadAction"); 
			controller.load(); 
		} 
	}	
	 
    this.bind = function(ctxName, selector) { 
		//var predicate = (ctxName!=null && ctxName!="") ? "[context][context='"+ctxName+"']" : "[context][context!='']";
		
		//just bind all elements that has the attribute context
        $("[context][context!='']", selector? selector : null).each (function(idx, elm) {
			var $e = $(elm);
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
				if( $e.data('is_hidden') ) $e.show().removeData('is_hidden');
	        	controlLoader(idx, elm);
	        }
	        else {
				$e.data('is_hidden', true);
	        	$e.hide();
	        }
        });
    } 
     
    this.loadViews = function(ctxName, selector) { 
		//var predicate = (ctxName!=null && ctxName!="") ? "[context][context='"+ctxName+"']" : "[context][context!='']";
        //loads all divs with context and displays the page into the div. 
        $('div[context][context!=""]', selector? selector : null).each ( containerLoader );
    } 
     
    //utilities 
    /* 
    * use init input for input type of element. this will set/get values for one field 
    * applicable for text boxes, option boxes, list. 
    * assumptions:  
    *     all controls have required,  
    *     all controls set a single value during onblur 
    *     all controls get the value from bean during load 
    *     all will broadcast to to reset dependent controls values, (those with depends attribute) 
    * customFunc = refers to the custom function for additional decorations 
    */ 
    this.initInput = function( elem, controller, customFunc ) { 
        var fldName = elem.name; 
        if( fldName==null || fldName=='' ) return; 
        var c = controller.get(fldName); 
        var  o = $(elem); 
        if(customFunc!=null) { 
            customFunc(elem, controller);     
        } 
        elem.value = (c ? c : "" ); 
        var dtype = o.attr("datatype"); 
        if(dtype=="decimal") { 
            elem.onblur = function () { $get(controller.name).set(fldName, NumberUtils.toDecimal(this.value) ); } 
        } 
        else if( dtype=="integer") { 
            elem.onblur = function () { $get(controller.name).set(fldName, NumberUtils.toInteger(this.value) ); } 
        } 
        else { 
            elem.onblur = function () { $get(controller.name).set(fldName, this.value ); } 
        }     
		
		//add hints
		if( $(elem).attr("hint")!=null ) {
			var isPassword = (elem.type == "password");
		
			var hintStyle = {color: "gray"};
			var oldColor = $(elem).css("color");
			if(c==null || c == "" ) {
				elem.value  = $(elem).attr("hint");
				$(elem).css(hintStyle);
				//if(isPassword) elem.type = "text";
			}	
			var lostFocus = function() { 
				if(this.value==null || this.value == "") {
					this.value = $(this).attr('hint'); 
					$(this).css(hintStyle); 
					//if(isPassword) elem.type = "text";
				}
			};
			$(elem).bind( 'blur', lostFocus );
			var gotFocus = function() { 
				if($get(controller.name).get(fldName)==null ||$get(controller.name).get(fldName)=="") {
					this.value="";
					$(this).css({color:oldColor}); 
					if(isPassword) elem.type = "password";
				}
			};
			$(elem).bind( 'focus', gotFocus );
		}
		 
        //add additional input behaviors 
        //$(this.input_attributes).each( 
        //    function(idx,func) { func(elem, controller); } 
        //) 
    }     
     
	this.notifyDependents = function(dependName, _context) {
		var ct = (_context !=null) ? _context + " " : "";
		var predicate = "[depends*='"+dependName+"'][context!='']";
		var filter =  ct + 'select'+predicate+','; 
        filter += ct + 'input'+predicate+','; 
        filter += ct + 'textarea'+predicate+', '; 
        filter += ct + 'table'+predicate+', '; 
        filter += ct + 'label'+predicate;
		$(filter).each( controlLoader );
	}
     
} 
 
 
 
//BeanUtils is for managing nested beans 
var BeanUtils = new function(){ 
    this.setProperty = function( bean, fieldName, value ) { 
        eval( 'bean.'+fieldName + '= value');
		
		var pcl = bean.propertyChangeListener;
		if( pcl && pcl[fieldName] ) {
			pcl[fieldName]( value );
		}
    } 
 
    this.getProperty = function( bean, fieldName ) {  
        return eval( 'bean.' + fieldName ); 
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
     
    this.invoke = function( control, action, args, immed  ) { 
        if( action.startsWith("_") ) { 
            action = action.substring(1); 
            this.navigate( action ); 
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
                if(immediate==false) this.validate(); 
                if(this.code == null) throw new Error( "Code not set"); 
                var outcome = action; 
                if( !outcome.startsWith("_")) { 
                    outcome = BeanUtils.invokeMethod( this.code, action, args ); 
                }     
                this.navigate( outcome ); 
            } 
            catch(e) { 
                alert( e.message, "ERROR!" ); 
            } 
        }     
    } 
 
    this.navigate = function(outcome) { 
        if(outcome==null) { 
            this.refresh(); 
        } 
        else if(outcome.classname == 'opener' ) { 
			outcome.parent = this.name;
            outcome.load(); 
        } 
        else if( outcome == "_close" ) { 
            if( ContextManager.modalStack.length > 0 ) { 
				var c = ContextManager.modalStack.pop();
                var tgt = c.target; 
				var parent = c.parent; 
                $('#'+tgt).dialog('close'); 
                if(parent!=null) $get(parent).refresh();
            } 
            else if( this.window && this.window.close ) { 
                this.window.close(); 
            }     
        }     
        else { 
            if(outcome.startsWith("_")) outcome = outcome.substring(1); 
         
            var target = this.name; 
            var _controller = this;     
            $('#'+target).load( this.pages[outcome], function() { _controller.refresh(); } ); 
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
    this.modalStack= []; 
    this.create = function( name, code, pages ) { 
        if(name==null)  
            throw new Error("Please indicate a name"); 
        var c = new Controller( code, pages ); 
        if(code.onload!=null) { 
            code.onload(); 
        } 
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
        for( var i=0; i < BindingUtils.loaders.length; i++ ) { 
            BindingUtils.loaders[i]();   
        } 
        BindingUtils.loaded = []; 
        BindingUtils.bind(); 
        BindingUtils.loadViews(); 
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
	BindingUtils.initInput(elem, controller, function(elem,controller) { 
			var i = 0; 
			if($(elem).attr("allowNull")!=null) { 
				var txt = $(elem).attr("emptyText"); 
				if(txt==null) txt = "-"; 
				elem.options[0] = new Option(txt,"");  
				i = 1; 
			} 
			var items = $(elem).attr("items"); 
			if( items!=null && items!='') { 
				var itemKey = $(elem).attr("itemKey"); 
				var itemLabel = $(elem).attr("itemLabel"); 
				var arr = controller.get(items);     
				$(elem).empty();
				$(arr).each( function(idx,value) {  
					var _key = value; 
					if( itemKey != null ) _key = value[itemKey]; 
					var _val = value;  
					if( itemLabel != null ) _val = value[itemLabel]; 
					elem.options[idx+i] = new Option(_val,_key);  
				});
			}

	}); 
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
	var isChecked = false;
	var checkedValue = $(elem).attr("checkedValue");
	if( checkedValue !=null && checkedValue == c ) {
		isChecked = true;
	}	
	else if( c == true || c == "true" ) {
		isChecked = true;	
	}	
	elem.checked = isChecked;
	
	elem.onchange = function () { 
		var v = ($(this).attr( "checkedValue" )==null) ? true : $(this).attr( "checkedValue" );
		var uv = ($(this).attr( "uncheckedValue" )==null) ? false : $(this).attr( "uncheckedValue" );
		$get(controller.name).set(this.name, (this.checked) ? v : uv );
	} 
} 
 
BindingUtils.handlers.input_button = function( elem, controller, idx ) { 
    var action = elem.getAttribute("name"); 
    if(action==null || action == '') return; 
    elem.onclick = function() { $get(controller.name).invoke( this, action );  }     
}; 
 
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

	var model = new DefaultTableModel();
	
	var multiselect = table.attr('multiselect') == 'true';
	var varStat =     table.attr('varStatus');
	var varName =     table.attr('varName');
		
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
		tpl = tbody.find('td').parent().remove();
		table.data('template', tpl);
	}
	
	model.onRefresh = function() { doRender() };
	model.load();
	
	var tabIdx;
		
	function doRender() {
		tbody.empty();
		tabIdx = table.data('index');
		status.index = 0;
		var list = model.getList();
		if(list==null) list = [];

		//render the rows
		for(var i=0; i<list.length; ++i) {
			var item = list[i]; 
			status.prevItem = (i > 0)? list[i-1] : null;
			status.nextItem = (i < list.length-1)? list[i+1] : null;

			createRow(i, item).appendTo( tbody );
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
		
		BindingUtils.bind( null, table );
	}
	
	function createRow(i, item) {
		var tr = tpl.clone().data('index', i).each(
			function(i,e) { evalAttr(i,e,item); }
		);
		
		var td = tr.find('td').mousedown( td_mousedown );
		
		if( !item ) {
			td.html('&nbsp;');
		}
		else {
			td.each(function(idx,e){
				var td = $(e);
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
				
				evalAttr(idx,e,item);
			});
		}
		
		return tr;
	}
	
	var prevRow;
	var prevTd;
	
	function td_mousedown(e) {
		if( !model.getDataModel() ) return;
		
		var td = e.tagName? $(e) : $(this);
		
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
			
	function evalAttr(i, elm, ctx) {
		var attrs = elm.attributes;
		for(var i=0; i<attrs.length; ++i) {
			var attr = attrs[i];
			if( !attr.value || attr.value === 'null' ) return;
			if( $.browser.msie && !$(elm).attr(attr.name) ) return;
			attr.value = attr.value.evaluate( function(n) { return resolve(n, ctx); } );
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
function PopupOpener( name, page, target, params ) { 
    this.classname = "opener"; 
    this.name = name; 
    this.page = page; 
    this.target = target;
    this.params = params; 
	this.parent;
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
        	div = $('<div></div>').appendTo('body');
        }
        
        div.load(this.page, function() { 
            BindingUtils.bind( null, div); 
            BindingUtils.loadViews( null, div);
            if(p!=null) {
                for( var key in p ) {
                    $ctx(n)[key] = p[key];    
                }
            }     
            ContextManager.modalStack.push( {target: div.attr('id'), parent: parent} ); 
        })
        .dialog({width:"auto",modal:"true", resizable:"false", close:function() {
        	//remove div if dynamically created
        	if( !target ) div.remove();	
        }}); 
    } 
} 
 
var InvokerUtil = new function() { 
    this.invoke = function( name, page, target ) { 
		$( "#"+target ).load(page, function() { 
			BindingUtils.bind( null, "#"+target); 
			BindingUtils.loadViews( null, "#"+target); 
		}); 
    }     
} 

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
	
	this.load = function( name, page, target ) { 
		$( "#"+target ).load(page, function() { 
			BindingUtils.bind( null, "#"+target); 
			BindingUtils.loadViews( null, "#"+target); 
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
}



