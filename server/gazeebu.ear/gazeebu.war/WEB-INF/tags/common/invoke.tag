<%@ tag import="com.rameses.invoker.client.DynamicHttpInvoker" %>
<%@ tag import="java.util.*"%>
<%@ attribute name="appcontext"%>
<%@ attribute name="host"%>
<%@ attribute name="service"%>
<%@ attribute name="method"%>
<%@ attribute name="var"%>
<%@ attribute name="params" rtexprvalue="true" type="java.lang.Object" required="false"%>

<%
	if(host==null) host = application.getInitParameter("app.host");
	if(appcontext==null) appcontext = application.getInitParameter("app.context");
	
    DynamicHttpInvoker dh = new DynamicHttpInvoker(host, appcontext);
    DynamicHttpInvoker.Action ac = dh.create(service);
	Object o = null;
	if(params==null) {
		o = ac.invoke(method);
	}
	if(params instanceof List) {
		o = ac.invoke(method, (List) params);
	}
	else {
		List l = new ArrayList();
		l.add(params);
		o = ac.invoke(method, l);
	}
	request.setAttribute(var, o);
%>

