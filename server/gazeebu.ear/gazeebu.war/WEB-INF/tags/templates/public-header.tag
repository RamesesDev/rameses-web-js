<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ attribute name="showLogin" rtexprvalue="true" %>
	
<table width="100%" style="height:100px;">
	<tr>
		<td>
			<a href="index.jsp">
				<img height="85px" border="0" src="${pageContext.servletContext.contextPath}/img/custom/big-logo.png">
			</a>
		</td>
		<c:if test="${showLogin == 'true' }">
			<td align="right" valign="top">
				<table style="color:white;font-size:10px;" cellpadding="0" cellspacing="0">
					<tr>
						<td>Username</td>
						<td>Password</td>
						<td>&nbsp;</td>
					</tr>
					<tr>
						<td><input type="text" size="15" context="login" name="data.username"></td>
						<td><input type="password" size="15" context="login" name="data.password"></td>
						<td><input type="button" value="Login" context="login" name="login" style="border:none;"></td>
					</tr>
				</table>
			</td>
		</c:if>	
	</tr>
</table>

