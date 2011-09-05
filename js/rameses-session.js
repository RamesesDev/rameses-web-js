/***
  This is always used when working with web apps. 
  This code is used to track session of the user and receive notifications
  from the server. 
**/
var Session = new function() {

	this.handler;
	this.handlers = {}
	var token;
	var host;
	var started = false;
	
	this.onstart;
	this.onexpired;
	
	this.connect = function(h) {
		if(started) return;
		started = true;		
		host = h;
		setTimeout(poll, 1000);
	}
	
	var self = this;

	
	//when adding session set the expire date at 5 minutes
	this.create = function( sessionId ) {
		$.cookie("sessionid",sessionId)
	}
	
	this.getId = function() {
		return $.cookie( "sessionid" );
	}
	
	this.destroy = function() {
		$.cookie( "sessionid", null );
	}
	
	
	var poll = function() {
		var sid = self.getId();
		//start polling for server updates.
		var d = {};
		d.sessionid = sid;
		d.host = host;	
		if(token) d.tokenid = token;
		
		$.ajax( 
			{
				url: "poll",
				type: "POST",
				data: d,
				error: function( xhr ) { 
					if(window.console) window.console.log( "error " + xhr.responseText );
					setTimeout(poll, 1000); 
				},
				success: function( data ) {
					if( data!=null && data.trim().length > 0  ) {
						if( data.startsWith("TOKEN")) {
							token = data;
							if(this.onstart) this.onstart( token );
							else if(window.console){
								window.console.log('connection started...new token id '+token+" .please provide onstart handler to remove this message");
							}	
							poll();
						}
						else if(data == "session-expired" || data == "-1") {
							self.destroy();
							if( self.onexpired ) self.onexpired();
							else alert("Session expired! Please provide an onexpired handler to remove this message");
						}
						else {
							try {
								if(data.trim().startsWith("{")) {
									data = $.parseJSON(data);
								}
								if( self.handler ) self.handler(data); 
								for(var n in self.handlers) {
									self.handlers[n](data);
								}
							}
							catch(e) {
								if(window.console) window.console.log( "error " + e.message );
							}
							finally {
								poll();
							}
						}	
					}
					else {
						setTimeout(poll, 1000);
					}
				}
			}
		);
    };
	
	
}

