//add threads to the thread list. if the added value is a function execute it. 
//if the added object has a run field, run that instead.
var ThreadPool = new function() {
	var threads = [];
	
	var run = function() {
		for(var i=0;i<threads.length;i++) {
			var b = threads[i];
			if( !b.pageContext || b.pageContext == window.location+"" ) {
				if(b.run) { 
					b.run();
				}	
				else {
					b();
				}	
			}	
		}
	}
	setInterval(run, 2000);

	this.addGlobal = function(t) {
		threads.push( t );
	}

	this.addPage = function(t) {
		if(t.run) {
			t.pageContext = window.location+"";
		}	
		else {
			t = {run: t, pageContext: window.location+""};
		}	
		threads.push( t );
	}
}

