<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib tagdir="/WEB-INF/tags/ui-components" prefix="ui" %>
<%@ taglib tagdir="/WEB-INF/tags/common" prefix="common" %>
<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>


<common:load-user-role />
<common:init-modules/>

<t:master>
	<jsp:attribute name="head_ext">
		<link rel="stylesheet" href="css/secured.css" type="text/css" />
		<script src="js/ext/session.js" type="text/javascript"></script>
				
		<style>
			input, 
			textarea, 
			span.hint 
			{ 
				font-family: arial, tahoma; font-size: 13pt; 
			}
		
			div.registration textarea,
			div.registration input.txt
			{
				margin-bottom: 10px;
				border: solid lightgrey 1px;
				-moz-border-radius: 4px; -webkit-border-radius: 4px;
				padding: 5px;
			}
			div.registration textarea {
				width: 300px; height: 80px;
			}
			div.registration input.txt { 
				width: 300px; height: auto;
			}
			div.registration input.btn {
				padding: 5px 30px;
			}
		</style>
		
		<script>
			$put(
				'registration',
				new function() {
				
					var entity = this.entity = {};
					
					this.submit = function() {
						var str = [];
						str.push('firstname: ' + entity.firstname);
						str.push('lastname: ' + entity.lastname);
						str.push('username: ' + entity.username);
						str.push('password: ' + entity.password);
						alert( str.join('\n') );
					};
					
					this.reset = function() {
						this.entity = {};
					}
					
				}
			);
		</script>
	</jsp:attribute>

	<jsp:attribute name="header">
		<t:secured-header username="${USER.username}">
			<jsp:attribute name="contextmenu">
				<jsp:include page="includes/${USER.usertype}/contextmenu.jsp" />
			</jsp:attribute>
		</t:secured-header>
	</jsp:attribute>

	<jsp:attribute name="footer">
		<t:footer />
	</jsp:attribute>

	<jsp:body>
		<t:content title="User Registration">
			<div class="registration">
				<input type="text" class="txt" context="registration" name="entity.firstname" hint="Firstname" caption="Firstname" required="true"/>
				<label labelFor="entity.firstname" context="registration"></label>
				<br/>
				
				<input type="text" class="txt" context="registration" name="entity.lastname" hint="Lastname" caption="Lastname" required="true"/>
				<label labelFor="entity.lastname" context="registration"></label>
				<br/>
				
				<input type="text" class="txt" context="registration" name="entity.username" hint="Username" caption="Username" required="true"/>
				<label labelFor="entity.username" context="registration"></label>
				<br/>
				
				<input type="password" class="txt" context="registration" name="entity.password" hint="Password" caption="Password" required="true"/>
				<label labelFor="entity.password" context="registration"></label>
				<br/>
				
				<input type="password" class="txt" context="registration" name="entity.confirmPass" hint="Confirm Password" caption="Confirm Password" required="true"/>
				<label labelFor="entity.confirmPass" context="registration"></label>
				<br/>
				
				<textarea context="registration" name="entity.message" hint="Write a short message."></textarea>
				<br/>
				
				<input type="button" class="btn" value="Submit" name="submit" context="registration"/>
				<input type="button" class="btn" value="Reset" name="reset" context="registration" immediate="true"/>
			</div>
		</t:content>
	</jsp:body>
		
</t:master>

