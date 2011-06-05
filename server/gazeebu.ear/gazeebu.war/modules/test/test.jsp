<%@ taglib tagdir="/WEB-INF/tags/templates" prefix="t" %>

<script type="text/javascript">
    $put("user", 
        new function() {
             
            var svc = ProxyService.lookup( 'UserAdminService' );

            this.entity = {};
            this.query = {};
            this.mode = "create";
            
            this.addNew = function() {
				var p = new PopupOpener( "modules/test/user_form.html", "userform", { mode: 'xcreate' } );
				p.title = 'Add New Record';
				p.options.height = 350;
				return p;
			}

			this.edit = function(objid) {
				this.entity = svc.read( {objid:objid} );
				var p = new PopupOpener( "modules/test/user_form_edit.html", "useredit", {'entity': this.entity} );
				p.title = 'Edit Record';
				p.options.height = 350;
				return p;
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
            
            this.showQuery = function() {
            	alert( 'date created: ' + this.query.dtcreated );
            };
        }
    );
</script>

<t:content title="Test Module">
	<jsp:attribute name="actions">
		<input type="text" context="user" name="query.dtcreated" datatype="date"/>
		<input type="button" value="Search" context="user" name="showQuery"/>
		<input type="button" context="user" name="addNew" value="Create" immediate="true"/>
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
