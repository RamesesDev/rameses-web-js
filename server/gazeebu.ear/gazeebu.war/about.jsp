<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common" %>


<t:master>

	<jsp:attribute name="head_ext">
		<link rel="stylesheet" href="css/public.css" type="text/css" />
	</jsp:attribute>
	
	<jsp:attribute name="header">
		<t:public-header showLogin="false"/>
	</jsp:attribute>

	<jsp:attribute name="footer">
		<t:footer />
	</jsp:attribute>

	<jsp:body>
		About Gazeebu	
	</jsp:body>
	
</t:master>

