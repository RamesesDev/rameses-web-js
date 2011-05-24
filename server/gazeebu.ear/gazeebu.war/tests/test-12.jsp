<html>
	<head>
        <link rel="stylesheet" href="js/jq_dialog/jquery-ui.custom.css" type="text/css" />
		<script src="js/jquery.js"></script>
		<script src="js/jq_dialog/jquery-ui.js"></script>
		<script src="js/rameses-lib.js"></script>
		
		<script>
			$put("test",
				new function() {
					this.entity = {passed: "m"};
					
					this.entity2 = {gender: "m"};
					
					this.show = function() {
						alert(this.entity.passed);
					}
					
					
					
					//lookup
					this.handler1 = function( o ) {
						$ctx("test").entity.language = o;
					}
					
					this.lookup = function() {
						return new PopupOpener("lookup", "lookup-sample12.html", "popup", {"handler": this.handler1});
					}
				}	
			);
		</script>
    </head>
    
    <body>
    	<input type="checkbox" context="test" name="entity.passed"/>
    	<br/>
    	<label context="test" depends="entity.passed"> checkbox value is #{entity.passed}</label>
    	<br>
    	<br>
    	<input type="checkbox" context="test" name="entity.passed" checkedValue="m" uncheckedValue="f"/>
    	<br/>
    	<label context="test" depends="entity.passed"> checkbox value is #{entity.passed}</label>
    	<br>
    	<br>
    	<input type="radio" context="test" name="entity2.gender" value="m"/>male
    	<input type="radio" context="test" name="entity2.gender" value="f"/>female
    	<br>
    	<label context="test" depends="entity2.gender">you choose #{entity2.gender}</label>
    	
    	<br>
    	<br>
    	<br>
    	<br>
    	<label context="test">#{entity.language}</label>
    	<input type="button" context="test" name="lookup" value="lookup langauge">
    	<br>
    	<div id="popup">   	
    	</div>
    </body>
</html>
