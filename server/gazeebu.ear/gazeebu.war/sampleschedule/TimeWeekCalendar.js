function TimeWeekCalendar( divId, options ){	
                     
	var schedule={};
	var container;
	var contentPane;
	var tbl="";
	//handlers
	this.onEdit = function(){};
	this.onDelete = function(){};
	this.divId = divId;
	this.options = options;
	
	//display the table	
	this.init = function (){	
		tbl = $('<table class="innertbl" border="1px"></table>')
		           .append(
		           		'<tr class="hdr" align="left">'+
							'<th></th>'+
							'<th>Mon</th>'+
							'<th>Tue</th>'+
							'<th>Wed</th>'+
							'<th>Thr</th>'+
							'<th>Fri</th>'+
							'<th>Sat</th>'+
							'<th>Sun</th>'+				
						'</tr>'
					);
		var time = 700;
		while( time < 2200 ) {
			tbl.append(
				'<tr class="' + ( time%2==0? 'even' : 'odd' ) + '">'+	
					(time%100==0? '<th class="time" rowspan="4">' + ( ( time+'' ).replace( /(\d+)(\d{2})$/, '$1:$2' ) ) + ( time<1200? ' am' : ' pm' ) + ' </th>' : '' )+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'mon' + time + '"></td>'+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'tue' + time + '"></td>'+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'wed' + time + '"></td>'+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'thu' + time + '"></td>'+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'fri' + time + '"></td>'+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'sat' + time + '"></td>'+
					'<td class="' + ( time%100==0? 'top ' : time%100==45? 'bottom ' : '' ) + 'sun' + time + '"></td>'+
				'</tr>'
			);
			time += (time%100==45)? 55 : 15;
		}		
		container = $('#'+this.divId).append( tbl );
		contentPane = $('<div></div>').appendTo( container );	
	}


	/**
	** add
	** item -> days[mon,tue,wed,thu,fri,sat,sun],from(700,715,730),to,content (these are constant names)
	** refresh -> to redraw (true/false)
	**/
	this.addItem=function( item, refresh ){      					
		        var xy=[];
		        var key=item.days+item.from+item.to;
		        for(var i=0; i<items.days.length; i++){			
			        var coordinates=[];
			        coordinates.push( XY( item.days[i]+items.from,"x" ) );
			        coordinates.push( XY( item.days[i]+items.from,"y" ) );
			        xy.push( coordinates );
		        }
		        schedule[key]=item;
		        schedule[key].xy=xy;
		        schedule[key].height=getHeight( item.from, items.to );
		        schedule[key].width=$('.innertbl').width()*.125;		
		        schedule[key].key=key;
                        
                if(refresh)this.load();	  			
	}
	
	//adds a list 	
	this.addList=function(list, refresh){	                       
                for(var j=0; j<list.length; j++){
                        var item=list[j];
                        var xy=[];
	                var key=item.days+item.from+item.to;
	                
	                for(var i=0; i<item.days.length; i++){			
		                var coordinates=[];
		                coordinates.push( XY( item.days[i]+item.from,"x" ) );
		                coordinates.push( XY( item.days[i]+item.from,"y" ) );
		                xy.push( coordinates );
	                }
	                schedule[key]=item;
	                schedule[key].xy=xy;
	                schedule[key].height=getHeight( item.from, item.to );
	                schedule[key].width=$('.innertbl').width()*.125;		
	                schedule[key].key=key;                                              
                }
                if(refresh)this.load();
	}
	
	//display
	this.load= function(){	  		
	        contentPane.html( '' );		
	        $.each( schedule,function( key ){			
		        for( var i=0; i<schedule[key].days.length; i++ ){
			        var code=
			        $(
				        '<div class="schedbox" style="background-color:'+schedule[key].color+'; height:'+schedule[key].height+'px; width:'+schedule[key].width+'px; left:'+schedule[key].xy[i][0]+'; top:'+schedule[key].xy[i][1]+';">'+
					        '<div align="right">'+
						        '<span>'+
							        '<a class="edit" href="#" title="Edit">'+
								        '<img class="icon" src="img/edit.png">'+
							        '</a>'+													
						        '</span>'+
						        '<span>'+
						                '<a class="delete" href="#" title="Delete">'+
								        '<img class="icon" src="img/trash.png">'+
							        '</a>'+									        
						        '</span>'+
					        '</div>'+
					        '<div>'+
						        schedule[key].content+
					        '</div>'+
				        '</div>'
			        );
			        code
			        .appendTo( contentPane )
			        .find( 'a.edit' )
			        .click( function() { edit( key ); } );
			        code
			        .appendTo( contentPane )
			        .find( 'a.delete' )
			        .click( function() { remove( key, false ); } );
		        }							
	        });                
	}	
	
	//edit
	function edit ( key ) {	        
	        if( onEdit ){
		        onEdit( schedule[key] );
	        }	
	}
	
	//remove
	function remove ( key, force ){	        
	        if( onRemove ){
		        if(onRemove(schedule[key])){
			        delete schedule[key];
			        this.load();
		        }			
	        }               
	}
		
	//gets the x and y coordinates---classname==day+from
	function XY( key, axis ){
		var AX = 0;
		var obj =$('#'+divId+' .'+key)[0];
				
		if( obj.offsetParent ){
			while( obj.offsetParent ){
				if( axis=="x" )   
					AX += obj.offsetLeft;
				else
					AX += obj.offsetTop;
				obj = obj.offsetParent;
			}
		}
		else if( obj.x ){
			if( axis=="x" ) 	
				AX += obj.x;
			else
				AX += obj.y;
		}

		return AX;
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
		return ( ( ( ( time-( time%100 ) )/100 )*60 )+( time%100 ) );
	}
	
	this.clear = function(){
		$.each( schedule,function( key ){
			delete schedule[key];
		});
	}

}
