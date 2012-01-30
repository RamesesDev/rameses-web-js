//timeweek calendar ui handler
BindingUtils.handlers.div_week_calendar = function(elem, controller) {
	var div = $(elem);
	if( div.data('model') ) return;
	
	if( !R.attr(elem, 'model') ) return;
	
	var model = controller.get( R.attr(elem,'model') );
	if( !model ) return;
	
	div.addClass('week-calendar')
	 .data('model', model);
	
	model.controller = controller;
	model.init( elem );
	model.load();
};

/*
 * version:			1.3
 * @author 			emerson chiong
 *
 * fork version:	1.0
 * @author			jaycverg
 * discription:		modified to support the rameses-ui framework
 */
function TimeWeekCalendar(options){
	
	var _this=this;

	this.schedules={};
	this.options = options || {};
	this.controller;
	
	var container;
	var contentPane;
	var tbl="";
	
	var color=[
				"CCCCCC","999999","FFFFCC","FFFF33","CCFFFF",
			  	"CCFFCC","CCFF99","CCFF66","CCFF33","99FFCC",
			  	"FFCCCC","FFCC33","CCCCFF","CCCC99","99CCFF",
			  	"00CCCC","CC9933","999900","6699FF","00FF33",
			  	"009900","CC66FF","CC6666","666FFF","3366CC",
			  	"006699","9933FF","993300","3333FF","00FF00",
			  	"00AA00","007700","001100","0000FF","440000"
			  ];
	var counter = 0;
    draw();    
	
	//display the table	
	function draw( t ){			
		var time;
		
		tbl = $('<table class="innertbl" border="1px"></table>')
		           .append(
		           		'<tr class="hdr" align="left">'+
							'<th class="tblhdr"></th>'+
							'<th class="tblhdr">Mon</th>'+
							'<th class="tblhdr">Tue</th>'+
							'<th class="tblhdr">Wed</th>'+
							'<th class="tblhdr">Thr</th>'+
							'<th class="tblhdr">Fri</th>'+
							'<th class="tblhdr">Sat</th>'+
							'<th class="tblhdr">Sun</th>'+				
						'</tr>'
					);
		if ( !t )			
			time = 700;
		else{
			time = (t-( t % 100 )) ;
		}
		while( time < 2200 ) {
			tbl.append(
				'<tr class="' + ( time%2==0? 'even' : 'odd' ) + '">'+	
					(time%100==0? '<th class="tblhdr time" rowspan="4">' + ( ( time+'' ).replace( /(\d+)(\d{2})$/, '$1:$2' ) ) + ( time<1200? ' am' : ' pm' ) + ' </th>' : '' )+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'mon' + time + '"></td>'+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'tue' + time + '"></td>'+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'wed' + time + '"></td>'+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'thu' + time + '"></td>'+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'fri' + time + '"></td>'+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'sat' + time + '"></td>'+
					'<td class="tbltd ' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'sun' + time + '"></td>'+
				'</tr>'
			);
			time += (time%100==45)? 55 : 15;
		}		
	}
	
	this.init = function(selector){  
		container = (selector? $(selector) : container).append( tbl );
		contentPane = $('<div></div>').appendTo( container );			
	}

	//add item. each item contains {day[mon,tue,wed,thu,fri,sat,sun], from, to, content and item.
	this.add = function(item) {
		var errs = [];
		if( !item.day) errs.push( "addItem error. Item day is required" ); 
		if( !item.from) errs.push( "addItem error. Item from is required" ); 
		if( !item.to) errs.push( "addItem error. Item to is required" ); 

		if( errs.length > 0 ) {
			alert( errs.join("\n") );
			throw new Error(errs.join("\n"));
		}
			
		if( !item.color ) {
			item.color = color[counter];
			counter=counter+1;
		}	
		var key = item.day +"_"+item.from+"_"+item.to;
		this.schedules[key] = item;	
		
		var tfrom = item.from;
		tfrom = _this.parseTime(tfrom);

		if ( tfrom < 700 ){			
			draw( tfrom );
			if( container ) {
				container.html( '' );
				_this.init();
			}
		}		
		
		this.load();	 
	}
	
	//adds a list 	
	this.addList=function(list, refresh){	                       
        for(var x=0; x<list.length; x++){										
			this.addItem(list[x],false);
			
		}
        if(refresh)this.load();
	}
	
	
	this.load = function() {
		if(!contentPane) return;
		
		contentPane.html( '' );
		var options = this.options || {};
		$.each(this.schedules, function(key){	
			var item = _this.schedules[key];
			var loc = getLocation(item.day + _this.parseTime(item.from));
			var x = loc.x + 0.12;
			var y = loc.y + 0.02;
			var width = $('.innertbl').width() * 0.124;
			var height = getHeight(_this.parseTime(item.from), _this.parseTime(item.to)); 
			var caption = item.caption? item.caption : 'Untitled';

			var sbox=$(
				'<div class="schedbox" style="background-color:'+item.color+'; height:'+height+'px; width:'+width+'px; left:'+x+'; top:'+y+';">'+
				'<div id="actions" align="right"></div>'+
				'<div><div class="text" align="center">' +caption+ '</div></div>'+
				'</div>'
			)
			.appendTo( contentPane )
			.hover(
				function(){ $(this).addClass('schedbox-hover'); },
				function(){ $(this).removeClass('schedbox-hover'); }
			);
			
			if(options.onclick){
				sbox.click( function() { 
					var res = options.onclick(item, this ) 
					if(_this.controller && res) {
						_this.controller.navigate( res, this );
					}
				});
			}
		});	
	}
	
		
	//gets the x and y coordinates---classname==day+from
	function getLocation( key, axis ){
		var loc = {x:0, y:0};
		var obj = container.find(' .'+key)[0];
				
		if( obj.offsetParent ){
			while( obj.offsetParent ) {
				loc.x += obj.offsetLeft;
				loc.y += obj.offsetTop;
				obj = obj.offsetParent;
			}
		}
		else if( obj.x ){	
			loc.x += obj.x;
			loc.y += obj.y;
		}

		return loc;
	}
	
	//computes for the height of the box
	function getHeight( from, to ){		
		var height=( getRange( from,to )*11 )-2;					
		if( getRange( from,to )<=1 ) 
			height=height-2;			
		return height;
	}
	
	//computes the nos. of 15 minutes	
	function getRange( from, to ){		
		return ( ( convertToMinute( to )-convertToMinute( from ) )/15 );
	}
	
	//converts the time to minutes
	function convertToMinute(time){
		return ((((time-( time%100 ))/100)*60 ) + ( time%100 ));
	}
	
	this.clear = function(){
		$.each( this.schedules,function( key ){
			delete _this.schedules[key];
		});
	}
	
	this.parseTime = function(time){
		return time.replace(/^0+|:/g,'');
	}
	
}


