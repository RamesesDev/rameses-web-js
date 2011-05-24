<%@ attribute name="title" %>
<%@ attribute name="actions" fragment="true" %>
<table width="100%">
	<tr>
		<td align="left" style="font-size:20px; color:darkslateblue;">
			<b>${title}</b>
		</td>
		<td align="right">
			<jsp:invoke fragment="actions"/>
		</td>
	</tr>
	<tr>
		<td align="left" colspan="2" style="border-top:1px solid lightgrey; padding-top:10px;">
			<jsp:doBody/>
		</td>
	</tr>
</table>
