/**
 * @author	jaycverg <jaycverg@gmail.com>
 * depends	jquery.1.4.+
 * @param	selector		- a valid jquery selector
 * @param	orientation		- a string value of either 'left', 'top',  'right', or 'bottom'
 * 							- default is 'bottom'
 * @param	offset			- an object to specify either the offsetX and offsetY of the element
 *							- fields are x and y (i.e., offset.x = -1)
 */


function InfoBox(selector, orientation, offset, delay) 
{
	var infobox;
	var _this = this;
	
	this.offset = offset;
	this.delay = delay;
	
	this.show = function(elem) {
		if($(elem).data('_infobox_attached')) return;
		
		if(!infobox) infobox = $(selector);
		var delay = this.delay? this.delay : 500; //millis
		$(elem).mouseover(function() {
			if( $(elem).data('info') ) return;
			
			var ib = infobox.clone(true).removeAttr('id').insertAfter(infobox).addClass('infobox');
			var css = position(elem);
			ib.mouseout(function(e){ 
				if(e.relatedTarget == this || e.relatedTarget == elem || $(e.relatedTarget).parents('.infobox')[0] == this ) return;
				hide($(this),$(elem));
			});
			$(elem).data('info', ib);
					
			var timeid = setTimeout(
				function() {
					ib.show().css(css);
					if(window.BindingUtils) BindingUtils.bind(null, ib);
				}, delay
			);
			$(elem).data('timeid', timeid);
		})
		.mouseout(function(e){
			var ib = $(elem).data('info');
			if( ib && (ib[0] == e.relatedTarget || $(e.relatedTarget).parents('.infobox')[0] == ib[0] )) return;
			if( ib ) {
				hide(ib, $(elem));
			}
		})
		.data('_infobox_attached', true)
		.trigger('mouseover');
	};
	
	function hide(ibox, elem) {
		ibox.remove();
		elem.removeData('info');
		var timeid = elem.data('timeid');
		clearTimeout(timeid);
	}
	
	function position(elem) {
		var b, css;
		var loc = getLocation(elem);
		
		if( orientation == 'left' ) {
			b = parseInt($(elem).css('border-left-width'));
			b = isNaN(b)? 0 : b;
			css = {left:loc.x - infobox.width() + b + 1, top:loc.y};
		}
		else if( orientation == 'top' ) {
			b = parseInt($(elem).css('border-top-width'));
			b = isNaN(b)? 0 : b;
			css = {left:loc.x, top:loc.y - infobox.height() + b + 1};
		}
		else if( orientation == 'right' ) {
			b = parseInt($(elem).css('border-right-width'));
			b = isNaN(b)? 0 : b;
			css = {left:loc.x + elem.offsetWidth - b - 1, top:loc.y};
		}
		else {
			b = parseInt($(elem).css('border-bottom-width'));
			b = isNaN(b)? 0 : b;
			css = {left:loc.x, top:loc.y + elem.offsetHeight - b - 1};
		}
		
		if( _this.offset && _this.offset.x ) css.left += _this.offset.x;
		if( _this.offset && _this.offset.y ) css.top += _this.offset.y;		
		
		return css;
	}
	
	function getLocation(e) {
		var x=0,y=0;
		while(e) {
			x+=e.offsetLeft;
			y+=e.offsetTop;
			e = e.offsetParent;
		}
		return {x:x, y:y};
	}
}