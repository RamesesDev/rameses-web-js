<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common" %>

<%@ attribute name="name" rtexprvalue="true"%>

<common:load-modules var="list" name="${name}" />

<table>
	<tr>
		<c:forEach items="${list}" var="item"> 
			<td>
				<input type="button" onclick="${item.action}" value="${item.caption}">
			</td>
		</c:forEach>
	</tr>
</table>

