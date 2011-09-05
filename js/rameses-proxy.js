/**
  Serializes services that can be used by the client
*/
var Env = new function() {
	this.data = {};
}

function DynamicProxy( context ) {
    this.context = context;
    this.create = function( svcName ) {
        return new _DynamicProxyService( svcName, this.context );
    }

	var processAsync = function(reqId, handler) {
		var contextPath = window.location.pathname.substring(1);
		contextPath = contextPath.substring(0,contextPath.indexOf('/'));
		var urlaction = "/" + contextPath + "/async/poll";
		$.ajax( 
			{
				url: urlaction,
				type: "POST",
				error: function( xhr ) { alert(xhr.responseText); },
				data: {requestId: reqId},
				async: true,
				success: function( data ) { 
					var o = $.parseJSON(data);
					if(o.status != "EOF") {
						if( o.status == "OK" ) {
							if(handler) handler(o.result);
						}	
						setTimeout( function() { processAsync( o.requestId, handler ) }, 5 );
					}	   	
				}
			}
		);		
	}	
	
	/* DynamicProxy */
	function _DynamicProxyService( name, context ) {
		this.name = name;
		this.context = context;
		
		//reduced to dummy.
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
			var contextPath = window.location.pathname.substring(1);
			contextPath = contextPath.substring(0,contextPath.indexOf('/'));
			var urlaction = "/" + contextPath + "/jsinvoker/"+this.name+ "."+action;
			
			var err = null;			
			var data = {};
			if( args )     { data.args = $.toJSON( args ); }
			
			data.env = $.toJSON( Env.data );
			
			if(handler==null) {
				var result = $.ajax( {
					url:urlaction,
					type:"POST",
					error: function( xhr ) { err = xhr.responseText },
					data: data,
					async : false }).responseText;

				if( err!=null ) {
					throw new Error(err);
				}
				
				var r = convertResult( result );
				if( r && r.classname=="com.rameses.common.AsyncResponse") {
					processAsync( r.id, handler );
					return null;
				}
				else {
					return r;
				}
			}
			else {
				$.ajax( {
					url: urlaction,
					type: "POST",
					error: function( xhr ) { handler( null, new Error(xhr.responseText) ); },
					data: data,
					async: true,
					success: function( data) { 
						var r = convertResult(data);
						if(r && r.classname=="com.rameses.common.AsyncResponse") {
							processAsync( r.id, handler );
						}
						else {
							handler(r); 
						}	
					}
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
