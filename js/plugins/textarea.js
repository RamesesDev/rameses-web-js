BindingUtils.handlers.div_textarea = function( elem, controller, idx ) 
{
   var e = $(elem);
   var name = R.attr(e, 'name');
   var cols = R.attr(e, 'cols') || 30;
   
	var textarea = $(elem).data('_textarea');
	if( !textarea ) 
	{	   
		var textarea = $('<textarea style="display:block;width:100%;padding-right:24px;"></textarea>');
		var close = $('<a href="#">x</a>').css('opacity',0);
		
		textarea.css('overflow', 'hidden')
		.css('resize', 'none')
		.keydown(function(){ resize(this, 30); })
		.keyup(function(){ resize(this, 30); })
		.focus(function(){ 
			resize(this, 30); 
			close.stop().animate({opacity: 1},100); 
		})
		.change(function(){
			if( name ) controller.set(name, this.value);
		});

		var wrp = $('<div style="position: relative;"></div>').addClass('txt-wrapper').prependTo(e)
		wrp.append( textarea );
		wrp.append(
			close
			.addClass('txt-close')
			.css({display:'block',width:'24px',height:'24px','line-height':'24px','text-align':'center'})
			.css({position:'absolute',top:0,right:0})
			.click(function(){ 
				resize(textarea[0], 10); 
				$(this).stop().animate({opacity:0},100);
				return false; 
			})
		);
		e.data('_textarea', textarea);
	}
		
	if( name ) textarea.val( controller.get(name) );
	
	resize( textarea[0], 10 );
	
	//helper
	function resize( ta, offset ) {
		var origH = $(ta).data('height');
		$(ta).css('height', 0 );
		var newH = ta.scrollHeight + offset;
		
		if( origH != newH ) {
			if( origH ) $(ta).css('height', origH);
			$(ta).data('height', newH).stop().animate({'height': newH},100);
		}
		else {
			$(ta).css('height', newH);
		}
	}
};
