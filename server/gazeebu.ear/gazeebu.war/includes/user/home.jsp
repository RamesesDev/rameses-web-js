<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/ui-components" prefix="ui" %>

<c:if test="${! empty ROLE}">
	<table width="100%" height="100%" cellpadding="0" cellspacing="0">
		<tr>
			<td width="140px" valign="top" valign="top">
				<ui:usermenu target="content"/>
			</td>
			<td width="2px">&nbsp;</td>
			<td valign="top" class="content-canvas">
				<table width="100%" height="100%">
					<tr>
						<td width="100%" height="100%" id="content" valign="top"></td>
					</tr>
				</table>
			</td>
		</tr>	
	</table>
</c:if>

<c:if test="${empty ROLE}">
	Welcome ${USER.username}<br/>
	News 
</c:if>

