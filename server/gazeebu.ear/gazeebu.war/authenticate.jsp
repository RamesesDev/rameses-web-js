<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common" %>

<c:if test="${empty SESSIONID}">
	<t:master>

		<jsp:attribute name="head_ext">
			<link rel="stylesheet" href="css/public.css" type="text/css" />
			<script src="js/ext/login.js" type="text/javascript"></script>
		</jsp:attribute>
		
		<jsp:attribute name="header">
			<t:public-header showLogin="false"/>
		</jsp:attribute>

		<jsp:attribute name="footer">
			<t:footer />
		</jsp:attribute>

		<jsp:body>
			<center>
				<h3>Gazeebu Login</h3>
				<h5>You are trying to access a secured page. Please login first</h5>
		
				<table style="color:black; border:1px solid lightgrey; background-color:#F8F8FF;">
					<tr>
						<td style="font-size: 80%;">Username:</td>
						<td><input type="text" size="20" context="login" name="data.username"></td>
						<td>&nbsp;</td>
					</tr>
					<tr>
				
						<td style="font-size: 80%;">Password:</td>
						<td><input type="password" size="20" context="login" name="data.password"></td>
					</tr>
					<tr>
						<td>&nbsp;</td>
						<td>
							<input type="button" value="Login" context="login" name="login"> 
						</td>
					</tr>
				</table>
			</center>	
		</jsp:body>
		
	</t:master>
</c:if>
