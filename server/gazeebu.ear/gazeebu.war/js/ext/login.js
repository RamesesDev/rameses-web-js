$put("login",
	new function() {
		this.data = {};
		this.login = function() {
			var svc = ProxyService.lookup('SessionService');
			var  id = svc.login(this.data);
			if(id.sessionid != null) {
				var date = new Date();
                date.setTime(date.getTime() + (60 * 1000 * 5));
				$.cookie("sessionid",id.sessionid, { expires: date })
		        window.location = "home.jsp";
		    }
		}
		
		this.onload = function() {
			var sid = $.cookie("sessionid")
			if(sid!=null) {
		    	window.location = "home.jsp";
		    }
		}
	}
);
