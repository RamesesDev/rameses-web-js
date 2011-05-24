<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common" %>
<%@ tag import="com.rameses.web.support.*" %>
<%@ tag import="java.util.*" %>

<%@ attribute name="target" rtexprvalue="true"%>

<%
	List perms = (List) request.getAttribute("ROLE-PERMISSIONS");
	if(perms==null) perms = new ArrayList();
	List elements = ModuleUtil.getEntries( application, "usermenu" );
	List newList = new ArrayList();
	Iterator iter = elements.iterator();
	while( iter.hasNext() ) {
		boolean isPermitted = true;
		Map o = (Map) iter.next();
		Object perm = o.get("permission");
		if( perm!=null) {
			isPermitted = ( perms.indexOf( perm)>=0 ); 
		}
		if(isPermitted) {
			Map m = new HashMap();
			m.put( "icon", o.get("icon")==null ? null : "modules/" + o.get("_name") + "/" + o.get("icon") );
			m.put( "context", o.get("context")==null ? o.get("_name") : o.get("context") );
			m.put( "path", "modules/" + o.get("_name") + "/" + o.get("page") );
			m.put( "caption", o.get("caption") );
			newList.add(m);
		}	
	}
	request.setAttribute("list", newList );
%>

<style>
	.usermenu tr.unselected a { font-size: 12px; font-family:arial; padding:4px;}
	.usermenu tr.selected { background: orange; }
	.usermenu tr.selected a { font-size: 12px; font-family:arial; color: #fff; padding:4px; }
</style>

<script type="text/javascript">
	function updateStyle( elem ) {
		$(elem)
		 .parents('table:first')
		  .find('tr')
		  .removeClass('selected')
		  .end()
		 .end()
		.parents('tr:first').addClass('selected');
	}
</script>

<table width="100%" class="usermenu" cellpadding="0" cellspacing="0">
	<c:forEach items="${list}" var="item">
		<tr class="unselected">
			<td>
			    <c:if test="${!empty item.icon}">
				    <img src="${item.icon}">
				</c:if>
				&nbsp;
			</td>
			<td>  
				<a href="#${target}=" onclick="InvokerUtil.invoke('${item.context}','${item.path}', '${target}' ); updateStyle(this);">
				    ${item.caption}
				</a>
			</td>
		</tr>
	</c:forEach>
</table>
