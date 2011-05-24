<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>

<script type="text/javascript">
	$put("role_list", new function() {

			this.mode = "create"; 
			this.query = {}; //for search
		  	var svc = ProxyService.lookup("RoleAdminService");
		  	
		  	this.addNew=function() {
		  		return new PopupOpener( "modules/role/role_form.html" );			    	  					
		  	}
                        
            this.delete = function(objid) {
				var name = svc.getName({objid:objid});
				if(confirm("Are you sure you want to delete this [" + name + "] role?")) {
                    svc.delete({objid:objid});
					alert("[" + name + "] role has been deleted");
					this.listModel.refresh(true);
                }				
            }
			
			this.save = function(o){
				if(this.mode = "create"){
					svc.create(o);
					alert("Role \"" + o.name +"\" saved.");
					this.listModel.refresh(true);
					return "_close";
				}
				//create if(this.mode == "edit") and this.edit function
			}
			
			this.listModel = {
				rows:14,
				fetchList:function(p){return svc.getList(p);}
				/*rows: 14,	
				fetchList: function( p ) {
					p.name = $ctx('role_list').query.name;
					p.masterrole = $ctx('role_list').query.masterrole;
					return svc.getList(p);
				}*/
			}		

			/*this.doSearch = function() {
				this.listModel.refresh(true);
			}*/
		}
	);
</script>

<t:content title="Roles">
<jsp:attribute name="actions">
<input type="button" context="role_list" name="addNew" value="Create Role" immediate="true">
</jsp:attribute>
   
<table context="role_list" model="listModel" varStatus="status" width="100%" class="list">
    <thead>
		<tr>
            <th class="list-column-first">Name</th>
            <th class="list-column">Master Role</th>			
            <th class="list-column-last">&nbsp;</th>
        </tr>                
    </thead>
    <tbody>
        <tr class="#{status.index%2==0?'even':'odd'}">
            <td name="name" width="50%"></td>
            <td name="masterrole"></td>
            <td style="width:16px ; height:22px">
				<a href="#" onclick="$ctx('role_list').delete('${objid}')"><img src="././img/delete.png"></a>
			</td>
        </tr>
    </tbody>
</table>
<input type="button" value="Last>>" context="role_list" name="listModel.moveLast"
       style="font-family:Trebuchet MS ;height:35px ; font-size:12px ; float:right" />
<input type="button" value="Next>" context="role_list" name="listModel.moveNext"
       style="font-family:Trebuchet MS ;height:35px ; font-size:12px ; float:right" />
<input type="button" value="<Prev" context="role_list" name="listModel.movePrev"
       style="height:35px ; font-size:12px ; float:right" />
<input type="button" value="<<First" context="role_list" name="listModel.moveFirst"
       style="font-family:Trebuchet MS ;height:35px ; font-size:12px ; float:right" />
<div id="role_popup" title="Create Role"></div>
    
