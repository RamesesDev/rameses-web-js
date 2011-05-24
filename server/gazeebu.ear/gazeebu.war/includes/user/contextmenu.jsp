<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/ui-components" prefix="ui" %>

<script>
	$put('role_selector', new function() {
		this.changeRole = function() {
			return new DropdownOpener($('#change-role-menu'));
		}
	});
</script>
<c:if test="${! empty ROLE}">Role: ${ROLE.title}</c:if>
<input type="button" context="role_selector" name="changeRole" value="Change Role"/>

<div id="change-role-menu" style="display:none;">
	<table cellpadding="0" cellspacing="0">
		<c:forEach items="${USER.roles}" var="item">
			<tr>
				<td  style="font-size:12px;"><a href="home.jsp?roleid=${item.objid}">${item.title}</a></td>	
			</tr>
		</c:forEach>
		<tr>
			<td style="padding-top:2px;border-bottom:1px solid gray;">&nbsp;</td>
		</tr>
		<tr>	
			<td style="font-size:12px;">
				&#171; <a href="home.jsp">Back to Home</a>
			</td>
		</tr>
	</table>
</div>