<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/ui-components" prefix="ui" %>

<script>
	$put( "student_home",
		new function() {
			this.home = function() {
				WindowUtil.reload(); 
			}
			this.enrol = function() {
				WindowUtil.load( "modules/enrollment/enrollment.jsp", "content" ); 
				window.onbeforeunload = function() { return "This will cancel changes. Continue."; }
			}
		}
	);	
</script>

<table width="100%">
	<tr>
		<td id="content">
			<h1>Students Home Page</h1>
			<br/>
			<a href="#" context="student_home" name="enrol">Enrol</a>
		</td>
	</tr>	
</table>






