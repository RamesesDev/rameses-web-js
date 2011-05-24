<html>
	<head>
		<script src="js/jquery.js"></script>
		<script src="js/rameses-lib.js"></script>
		
		<script>
			$put("test",
				new function() {
					this.departments = [
										{code: "CS", name:"COMPUTER SCIENCE"},
										{code: "CHEM", name:"CHEMISTRY"}
									   ]
					this.courses = {
							      	"CS":["PROGRAMMING", "SOFT ENG"],
							      	"CHEM":["BIOCHEM", "INORGANIC"]
							      };
					
					this.deptcourses = function() {
						if(this.entity.deptcode==null) 
							return[];
						else 
							return this.courses[this.entity.deptcode];
						
					}
					
					this.entity = {};
				}	
			);
		</script>
    </head>
    
    <body>
    	Department: <select context="test" items="departments" name="entity.deptcode" itemKey="code" itemLabel="code"></select>
    	<label context="test" depends="entity.deptcode">#{entity.deptcode}</label>
    	<br/>
    	Course: <select context="test" items="deptcourses()" name="entity.courses" depends="entity.deptcode" allowNull="true"></select>
    </body>
</html>
