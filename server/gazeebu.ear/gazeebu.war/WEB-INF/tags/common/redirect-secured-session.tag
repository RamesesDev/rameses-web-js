<%@ tag import="javax.servlet.http.Cookie"%>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common"%>
	
<common:check-session/>
<%
	if( request.getAttribute("SESSIONID") != null ) {
		response.sendRedirect("home.jsp");
	}
%>

