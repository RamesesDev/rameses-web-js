<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>

<script type="text/javascript">
    $put("user", 
        new function() {
             
            var svc = ProxyService.lookup( 'UserAdminService' );
            
                        
            this.typeList = [];
			this.parentList = [];
                       
            this.entity = {};
            this.query = {};
            this.mode = "create";
            
            this.addNew = function() {
				var p = new DropdownOpener( "modules/user/user_form.html" );
				//p.title = 'Add New Record';	
				//p.options.show = "fade";
				//p.options.hide = "explode";
				//p.options.width = 400;
				//p.options.height = 300;
				return p;
			}

			this.save = function() {
				if(this.mode == "create") {
                    this.entity = svc.create(this.entity);
                }
                else {
                    svc.update(this.entity);
                }
                
                this.userListModel.refresh( true );
                this.entity = {};
                alert("Record saved");
                return "_close";
			}

			this.edit = function(objid) {
				this.entity = svc.read( {objid:objid} );
				return new PopupOpener( "modules/user/user_form_edit.html", "useredit", {'entity': this.entity} );
			}
            
            this.remove = function(objid) {
                if(confirm("Please confirm to remove this record.")) {
                    svc.remove({"objid" : objid});
                    this.userListModel.refresh( true );
                }
            }
            
            this.doSearch = function() {
				this.userListModel.refresh( true );            	
            }
            
            this.userListModel = {
            	rows: 15,
				fetchList: function( p ) {
					p.search = $ctx('user').query.search;
					return svc.getList(p);
				}
            }
            
            this.searchFilter = function(o) {
            	return svc.searchSuggest({'type':o});
            }
        }
    );
</script>

<t:content title="Users">
	<jsp:attribute name="actions">
		<table>
			<tr>
				<td align="left">
					Search:<input type="text" context="user" name="query.search" suggest="searchFilter"/>
					<input type="button" context="user" name="doSearch" value="Go" immediate="true" />  
				</td>
				<td align="right">
					<input type="button" context="user" name="addNew" value="Create" immediate="true"/>  
				</td>
			</tr>
		</table>  
	</jsp:attribute>
	<jsp:body>
		<table class="list" context="user" model="userListModel" varStatus="status" width="100%" cellpadding="0" cellspacing="0">
			<thead>
				<tr>
					<td class="list-column-first" align="left">Username</td>
					<td class="list-column" align="left">Fullname</td>   
					<td class="list-column" align="left">Email</td>
					<td class="list-column-last"  align="left">&nbsp;</td>
				</tr>                 
			</thead>
			<tbody>
				<tr class="#{status.index%2==0?'list-row-even':'list-row-odd'}">
					<td class="list-row-column-first" name="username"></td>
					<td class="list-row-column" name="fullname"></td>
					<td class="list-row-column" name="email"></td>
					<td class="list-row-column-last" align="right">
						<a href="#" onclick="$get('user').invoke(null, 'edit', '#{objid}', false)">
							<img src="././img/edit.gif">edit
						</a>
						<a href="#" onclick="$get('user').invoke( null, 'remove', '#{objid}', false)">
							<img src="././img/remove.gif">remove    
						</a>
					</td>
				</tr>
			</tbody>
		</table>
		<div align="right" style="font-size:9px;">form-version-0.05</div>
		<input type="button" context="user" name="userListModel.movePrev" value="&lt;&lt; Previous" immediate="true">
		<input type="button" context="user" name="userListModel.moveNext" value="Next &gt;&gt;" immediate="true">
		
	</jsp:body>
</t:content>
