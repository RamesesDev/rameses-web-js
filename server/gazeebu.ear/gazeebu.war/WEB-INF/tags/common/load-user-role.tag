<%@ tag import="javax.servlet.http.Cookie"%>
<%@ tag import="java.util.*" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>

<c:if test="${(! empty USER) and (! empty param['roleid']) }">
	<%
		//if there is a role specified, find and store it roles. store also associated permissions
		Map user = (Map) request.getAttribute("USER");
		String roleid = request.getParameter("roleid");
		if(roleid !=null ) {
			Map currentRole = null;
			List roles = (List)user.get("roles");
			Iterator _iter = roles.iterator();
			while(_iter.hasNext() ) {
				Map m = (Map)_iter.next();
				if( roleid.equals( m.get("objid") ) ) {
					currentRole = m;
					break;
				}
			}
			if(currentRole!=null) {
				request.setAttribute("ROLE", currentRole );
				List perms = (List) ((Map)user.get("permissions")).get(roleid+"");
				if(perms == null ) perms = new ArrayList();
				request.setAttribute("ROLE-PERMISSIONS", perms );
			}
		}
	%>
</c:if>
