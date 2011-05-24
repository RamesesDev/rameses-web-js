<a href="#" onclick="window.location.reload();return false;">&#171; Back</a>


<h1>Preregistration</h1>

<table>
	<tr>
		<td valign="top">
			Select a course
			<table context="enrollment" items="majorCourses" style="border:1px solid gray;" varName="item">
				<tbody>
					<tr>
						<td><a href="#" onclick="$get('enrollment').set('selectedCourse', '#{item.code}');return false;" >
							#{item.code} #{item.title}</a>
						</td>
					</tr>
				</tbody>
			</table>
		</td>
		<td width="100">
			&nbsp;
		</td>
		<td  valign="top">
			Selected Course <label context="enrollment" depends="selectedCourse">#{selectedCourse}</label>
			<table context="enrollment" items="majorCourseSchedules()" style="border:1px solid gray;" varName="item" depends="selectedCourse"
				cellpadding="0" cellspacing="0">
				<thead>
					<tr>
						<td>&nbsp;</td>
						<td style="background-color:orange;color:white">Schedule</td>
						<td style="background-color:orange;color:white">Room</td>
						<td style="background-color:orange;color:white">Instructor</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><input type="checkbox"/></td>
						<td>#{item.schedule}</td>
						<td>#{item.room}</td>
						<td>#{item.teacher}</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td colspan="4">
							<input type="button" context="enrollment" name="addSchedule" value="Add"/>
						</td>
					</tr>
				</tfoot>
			</table>
		</td>
	</tr>
	<tr>
		<td colspan="3">
			Selected Schedules:
			<table width="100%" context="enrollment" items="selectedSchedules" style="border:1px solid gray;" varName="item" cellpadding="0" cellspacing="0">
					<thead>
						<tr>
							<td>&nbsp;</td>
							<td style="background-color:orange;color:white">Schedule</td>
							<td style="background-color:orange;color:white">Room</td>
							<td style="background-color:orange;color:white">Instructor</td>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td><input type="checkbox"/></td>
							<td>#{item.schedule}</td>
							<td>#{item.room}</td>
							<td>#{item.teacher}</td>
						</tr>
					</tbody>
			</table>
		</td>
	</tr>
</table>	

<input type="button" context="enrollment" name="_select-blocks" value="Next"/>