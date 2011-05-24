<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t"%>
<%@ taglib tagdir="/WEB-INF/tags/ui-components" prefix="ui"%>
<%@ attribute name="username" rtexprvalue="true" %>
<%@ attribute name="contextmenu" fragment="true" %>
	
<div id="role-popup"></div>
<table width="100%" height="50px">
	<tr>
		<td width="3%">
			<a href="home.jsp" style="color:white">
				<img src="${pageContext.servletContext.contextPath}/img/custom/small-logo.png" border="0" height="37px"/>
			</a>
		</td>
		<td align="left" valign="center"  style="padding-top:10px;">
			<a href="${pageContext.servletContext.contextPath}/home.jsp" style="color:white">
				UNIVERSITY OF THE PHILIPPINES<br>
				University of the Philippines Cebu
			</a>
		</td>
		<td align="right" valign="top" style="color:white;font-size:12px;font-family:arial;padding-top:8px;">
			<jsp:invoke fragment="contextmenu" />	
		</td>
		<td align="right" width="180" valign="top" style="color:white;font-size:12px;font-family:arial;padding-top:10px;">
			<a context="session" name="showProfileMenu">
				Welcome ${username} &#9660;
			</a>
		</td>
	</tr>
</table>

<div id="profile-menu" style="display: none">
	<div style="padding:1px;font-size:12px;"> 
		<a href="#">Edit Profile</a><br/>
		<a href="#">Change Password</a><br/>
		<hr>
		<a context="session" name="logout">Logout</a>
	</div>
</div>

 

