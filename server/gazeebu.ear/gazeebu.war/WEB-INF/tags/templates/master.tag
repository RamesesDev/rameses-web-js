<%@ taglib tagdir="/WEB-INF/tags/custom" prefix="custom" %>
<%@ attribute name="head_ext" fragment="true" %>
<%@ attribute name="header" fragment="true" %>
<%@ attribute name="footer" fragment="true" %>
<%@ attribute name="bodyheight" %>

<html>
	<head>
		<title>Gazeebu</title>
		<meta charset="UTF-8" >
        
        <link rel="stylesheet" href="${pageContext.servletContext.contextPath}/js/lib/css/jquery-ui/jquery.css" type="text/css" />
        <link rel="stylesheet" href="${pageContext.servletContext.contextPath}/js/lib/css/rameses-lib.css" type="text/css" />
        <script src="${pageContext.servletContext.contextPath}/js/lib/jquery-all.js"></script>
	    <script src="${pageContext.servletContext.contextPath}/js/lib/rameses-lib.js"></script>
		<jsp:invoke fragment="head_ext"/>
	</head>
	<body style="margin:0; font-family:Arial;">
		<table width="100%" height="100%" cellpadding="0" cellspacing="0" >
			<tr>
				<td class="header-layout">&nbsp</td>
				<td class="header-layout" id="middle-width">
					<jsp:invoke fragment="header"/>
				</td>
				<td class="header-layout">&nbsp;</td>
			</tr>
			<tr>
				<td>&nbsp;</td>
				<td id="middle-width" height="100%" valign="top" style="padding-top:5px;padding-bottom:10px;">
					<jsp:doBody/>
				</td>
				<td>&nbsp;</td>
			</tr>
			<tr>
				<td>&nbsp</td>
				<td id="middle-width" >
					<jsp:invoke fragment="footer" />
				</td>
				<td>&nbsp;</td>
			</tr>
		</table>
	</body>
</html>
