<script>
	$put( "enrollment", 
		new function() {
		
			this.selectedCourse = "IT101";
			
			this.majorCourses = [
				{code:"IT101", title: "Introduction to Programming"},
				{code:"IT102", title: "History of the Internet"},
				{code:"MT01", title: "Basic Algorithms"}
			];	
			
			var majorSchedules = {
				"IT101" : [
					{objid:"IT01_1", schedule:"08:30-09:30 MWF", room:"102", teacher:"***"},
					{objid:"IT01_2", schedule:"07:30-08:30 TTh", room:"102", teacher:"Flores, John"},
					{objid:"IT01_3", schedule:"05:30-06:30 T;07:00-12:00 Sat", room:"102", teacher:"Flores, John"}
				],
				"IT102" : [
					{objid:"IT02_1", schedule:"08:30-09:30 MWF", room:"210", teacher:"***"},
					{objid:"IT02_2", schedule:"07:30-08:30 TTh", room:"225", teacher:"Zamora, Jess"}
				],
				"MT01" : [
					{objid:"MT01_1", schedule:"11:30-12:30 MWF", room:"410", teacher:"***"},
					{objid:"MT01_2", schedule:"17:00-18:00 TTh", room:"425", teacher:"Nazareno, Elmo"},
					{objid:"MT01_3", schedule:"06:30-07:30 MWF", room:"111", teacher:"***"}
				],
			}
			
			this.majorCourseSchedules = function() {
				if( this.selectedCourse == null ) {
					return [];
				}
				else {
					return majorSchedules[this.selectedCourse];
				}
			}
			
			this.selectedSchedules = [];
			this.addSchedule = function() {
				alert('adding item');
			}
		},
		{
			"default": "modules/enrollment/pages/enrollment_p1.jsp",
			"select-blocks": "modules/enrollment/pages/enrollment_p2.jsp"
		}
	);	
</script>


<div context="enrollment"></div>
