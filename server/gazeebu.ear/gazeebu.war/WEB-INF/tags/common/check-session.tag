<%@ tag import="javax.servlet.http.Cookie"%>
<%@ tag import="com.rameses.invoker.client.DynamicHttpInvoker" %>
<%@ tag import="java.util.*" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common"%>

<%
	//this code loads the session, and if there is one, loads it in the request attribute

	String cookieName = "sessionid";
	Cookie cookies [] = request.getCookies ();
	Cookie myCookie = null;
	
	if (cookies != null) {
		for (int i = 0; i < cookies.length; i++) {
			if (cookies [i].getName().equals (cookieName)) {
				myCookie = cookies[i];
				break;
			}
		}
	}
	//if session is in cookie, must check cache in database or memcache
	if( myCookie != null ) {
		String sessionid = myCookie.getValue();
		String host = application.getInitParameter("app.host");
		String appcontext = application.getInitParameter("app.context");
		DynamicHttpInvoker dh = new DynamicHttpInvoker(host, appcontext);
		DynamicHttpInvoker.Action ac = dh.create("SessionService");
		Map user = (Map)ac.invoke("getUserProfile", new Object[] {sessionid} );
		if(user!=null) {
			request.setAttribute("SESSIONID", sessionid );
			request.setAttribute("USER", user );
		}
		else {
			myCookie.setMaxAge(0);
			response.addCookie( myCookie );
		}
	}
	
%>



