<%@ tag import="javax.servlet.http.Cookie"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common"%>

<common:check-session/>	
<%
	if( request.getAttribute( "SESSIONID" )== null ) {
		response.sendRedirect("authenticate.jsp");
	}
%>

