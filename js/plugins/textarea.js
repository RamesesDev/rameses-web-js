BindingUtils.handlers.div_textarea = function( elem, controller, idx ) 
{
   var e = $(elem);
   var name = R.attr(e, 'name');
   var cols = R.attr(e, 'cols') || 30;
   var textarea;
   var controls;
   var close;
   
	var textarea = $(elem).data('_textarea');
	if( !textarea ) {	   
		init();
	}
	else {
		controls = e.data('_controls');
		close = e.data('_close');
	}

	var value = controller.get(name) || '';
	if( name ) textarea.val( value );
	if( R.attr(elem, 'hint') ) {
		new InputHintDecorator( textarea[0], R.attr(elem,'hint') );
	}
	
	if( value )
		textarea.trigger('focus');
	else
		close.trigger('click');

	//helper
	function init() {
		if( e.children().length > 0 ) {
			controls = e.children().wrap('<div class="txt-controls"></div>').parent().hide();
		}
		
		var tpl = $('<table width="100%"><tr><td><textarea/></td><td valign="top" width="24px"><a href="#">x</a></td></tr></table>').prependTo(e);
		textarea = tpl.find('textarea')
		 .wrap('<div class="hint-wrapper" style="width:100%"></div>')
		 .css({
			width:'100%',outline:'none',
			resize:'none',overflow:'hidden'
		 });
		
		close = tpl.find('a')
		 .css('opacity',0)
		 .addClass('txt-close')
		 .css({display:'block',width:'24px',height:'24px','line-height':'24px','text-align':'center'})
		 .click(a_click);
		
		textarea
		 .keydown(function(){ resize(this, 30); })
		 .keyup(function(){ resize(this, 30); })
		 .focus(ta_focus)
		 .change(update_bean);
		
		e.data('_textarea', textarea)
		 .data('_close', close)
		 .data('_controls', controls);
	}
	
	function resize( ta, offset ) {
		var origH = $(ta).data('height');
		$(ta).css('height', 0 );
		var newH = ta.scrollHeight + offset;
		
		if( origH != newH ) {
			if( origH ) $(ta).css('height', origH);
			$(ta).data('height', newH).stop().animate({'height': newH},50);
		}
		else {
			$(ta).css('height', newH);
		}
	}
	
	function ta_focus() {
		resize(this, 30); 
		close.stop().animate({opacity: 1},50);
		if( controls ) controls.show();
	}
	
	function a_click(){ 
		resize(textarea[0], 0);
		textarea.val('').trigger('change');
		$(this).stop().animate({opacity:0},50);
		if( controls ) controls.hide();
		return false; 
	}
	
	function update_bean() {
		if( name ) controller.set(name, this.value);
	}
};
