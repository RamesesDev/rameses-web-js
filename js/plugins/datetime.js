
function DateTimeModel(m, d, y, minYear) {

	this.month = m || "";
	this.year = y || "";
	this.day = d || "";
	this.hour = "";
	this.minute = "";

	
	this.months = [
		{id:"", name:""},
	  {id:"1", name:"Jan"},
	  {id:"2", name:"Feb"},
	  {id:"3", name:"Mar"},
	  {id:"4", name:"Apr"},
	  {id:"5", name:"May"},
	  {id:"6", name:"Jun"},
	  {id:"7", name:"Jul"},
	  {id:"8", name:"Aug"},
	  {id:"9", name:"Sep"},
	  {id:"10", name:"Oct"},
	  {id:"11", name:"Nov"},
	  {id:"12", name:"Dec"}
	];
	
	this.years = [""];
	
	minYear = minYear || 1900;
	var curDate = new Date();
	for( var i=minYear; i<= curDate.getFullYear(); ++i ) {
		this.years.push( i+'' );
	}
	
	this.days = ["",
	  "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", 
	  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", 
	  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", 
	  "31",  
	];
	
	this.minutes = [""];
	for( var m=0; m<60; m++ ) {
		if( m < 10 ) this.minutes.push( "0"+m);
		else this.minutes.push(m);
	}
	this.hours = [""];
	for( var h=0; h<24; h++ ) {
		if( h < 10 ) this.hours.push( "0"+h);
		else this.hours.push(h);
	}
	
	
	this.getDate = function() {
		if(this.year!="" && this.month!="" && this.day!="" && this.hour!="" && this.minute!="" )
			return this.year + '-' + this.month + '-' + this.day + " " + this.hour + ":" + this.minute;
		else
			return null;
	}
} 

BindingUtils.handlers.datetime = function( elem, controller, idx ) {
   var e = $(elem);
   var modelName = "_datemodel_" + R.attr(e, 'name').replace(/\./g, "_" );
   var model = controller.code[modelName];
   if(model==null) {
		controller.code[modelName] = new DateTimeModel();
		model = controller.get(modelName);
   }
   
   var monthSelection;
   var daySelection;
   var yearSelection;
   
   if(e.children().length == 0) {
      var div = $('<div></div>');
		
	 
		
	  /***********************************************	
	   month
	  ************************************************/
      monthSelection = $('<select class="m"></select>');
      var ms = $(monthSelection);
      for( var i=0; i<model.months.length ; i++ ) {
         $('<option value="' + model.months[i].id + '">'  + model.months[i].name + '</option>').appendTo(monthSelection);
      }
      ms.appendTo(div);
      //$get(controller.name).get(modelName).month = ms.val();//FORCE SET
      ms.change(function() {
         $get(controller.name).get(modelName).month = this.value ;
		 updateFieldValue();
      });

	  /***********************************************	
	   day
	  ************************************************/
      daySelection = $('<select class="d"></select>');
      var ds = $(daySelection);
      for( var i=0 ; i<model.days.length ; i++) {
         $('<option value="' + model.days[i] + '">' + model.days[i] + '</option>').appendTo(daySelection);
      }
      ds.appendTo(div);
      //$get(controller.name).get(modelName).day = ds.val();
      ds.change(function() {
         $get(controller.name).get(modelName).day = this.value;
		 updateFieldValue();
      });

	  /***********************************************	
	   year
	  ************************************************/
      yearSelection = $('<select class="y"></select>');
      var ys = $(yearSelection);
      for( var i=0 ; i<model.years.length ; i++) {
         $('<option value="' + model.years[i] +'">' + model.years[i] + '</option>').appendTo(yearSelection);
      }
      ys.appendTo(div);
      //$get(controller.name).get(modelName).year = ys.val();
      ys.change(function() {
         $get(controller.name).get(modelName).year = this.value;
		 updateFieldValue();
      });
      
	   /***********************************************	
	   time in hours and minutes
	  ************************************************/ 	
	  var hourSelection = $('<select class="H"></select>');	 	
	  var _hourSelection = $(hourSelection);
	  for( var i=0; i<model.hours.length ; i++ ) {
         $('<option value="' + model.hours[i] + '">'  + model.hours[i] + '</option>').appendTo(hourSelection);
      }
      _hourSelection.appendTo(div);	
	  _hourSelection.change(function() {
         $get(controller.name).get(modelName).hour = this.value;
		 updateFieldValue();
      });
	  
	  var minSelection = $('<select class="M"></select>');	 	
	  var _minSelection = $(minSelection);
	  for( var i=0; i<model.minutes.length ; i++ ) {
         $('<option value="' + model.minutes[i] + '">'  + model.minutes[i] + '</option>').appendTo(minSelection);
      }
      _minSelection.appendTo(div);	
	  _minSelection.change(function() {
         $get(controller.name).get(modelName).minute = this.value;
		 updateFieldValue();
      });
      div.appendTo(e);
	  
   } else {
      monthSelection = e.find('select.m');
      daySelection = e.find('select.d');
      yearSelection = e.find('select.y');
   }
   
   $('option[value="' + model.month + '"]', monthSelection).attr('selected', 'selected');
   $('option[value="' + model.day + '"]', daySelection).attr('selected', 'selected');
   $('option[value="' + model.year + '"]', yearSelection).attr('selected', 'selected');

   
   function updateFieldValue() {
		var n = R.attr(elem, 'name');
		if( n ) controller.set(n, model.getDate());
   }
}
