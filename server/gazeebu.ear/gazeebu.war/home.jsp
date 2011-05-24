<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/ui-components" prefix="ui" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common" %>
<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>

<common:require-secured-session /> 

<c:if test="${! empty SESSIONID}">
	<common:load-user-role />
	<common:init-modules/>

	<t:master>
		<jsp:attribute name="head_ext">
			<link rel="stylesheet" href="css/secured.css" type="text/css" />
			<script src="js/ext/session.js" type="text/javascript"></script>
		</jsp:attribute>
	
		<jsp:attribute name="header">
			<t:secured-header username="${USER.username}">
				<jsp:attribute name="contextmenu">
					<jsp:include page="includes/${USER.usertype}/contextmenu.jsp" />
				</jsp:attribute>
			</t:secured-header>
		</jsp:attribute>

		<jsp:attribute name="footer">
			<t:footer />
		</jsp:attribute>

		<jsp:body>
			<jsp:include page="includes/${USER.usertype}/home.jsp" />
		</jsp:body>
	
	</t:master>
</c:if>

