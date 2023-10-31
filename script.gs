function main() {
	//Global variables

	var sheetID = "13G0sc_jrstIvJ_28qII6JqcmcNkP4ob8Xl0HKbACFLg";
  var timeZone = "America/New_York";

	//input variables

	var input = SpreadsheetApp.openById(sheetID).getSheets()[0].getRange("A2:B").getValues().filter(String);
	var input = input.filter(function(row) {
		return !row.every(function(cell) {
			return cell === '';
		});
	});
	var inputJSON = arrayToJsonObject(input);

	const token = inputJSON["Token"];
	const city = inputJSON["City"];
  const country = inputJSON["Country"];
	const eventType = inputJSON["Event Type/Genre"];
	const startDate =  Utilities.formatDate(inputJSON["StartDate"], timeZone, "yyyy-MM-dd");
	const endDate = Utilities.formatDate(inputJSON["End Date"], timeZone, "yyyy-MM-dd");
  const calenderID = inputJSON["CalenderID"];

	//output variables

	output = SpreadsheetApp.openById(sheetID).getSheets()[1];
  output.clear();
  output.appendRow(["Event Name","Event Description","Summary","Date","Genre","Costs","Venue","Venue URL"]);

  //flow Starts
	linkbuilderEventBrite(country,city,eventType,startDate,endDate,calenderID,token,output);
}



//Utility Functions Starts here

function linkbuilderEventBrite(country,city,eventType,startDate,endDate,calenderID,token,output)
{
  var link="https://www.eventbrite.com/d/"+country+"--"+city+"/"+eventType+"--events/?start_date="+startDate+"&end_date="+endDate;

  console.log(link);

  var sourcecode = UrlFetchApp.fetch(link).getContentText('UTF-8');
  var ulsection = sourcecode.match(/<section><ul(.*?)<\/ul><\/section>/)[0];
  var multi_li = ulsection.match(/<li class="(.+?)<\/li>/g);

  for (var i = 0; i < multi_li.length; i++) 
  {

    
    var carddetails=multi_li[i].match(/"event-card-details">(.*?)<\/section>/);

    //Extract Url
    
    var url=carddetails[0].match(/<a href="(.+?)"/g)[0].replace('<a href="',"").replace('"',"");
    eventID = getEventIDfromURL(url);
    eventData = getEventDetailsByID(eventID,token);

    var eventName=eventData["name"]["text"];
    var eventDescription=eventData["description"]["text"];
    var summary=eventData["summary"];

    var eventStartTime=eventData["start"]["utc"];
    eventStartTime= new Date(eventStartTime);

    var genre = eventType;
    var costs = eventData["is_free"];

    if(costs==true){
      costs="Free";
    }

    var venueID=eventData["venue_id"];
    var venueData = getVenueDetailsByID(venueID,token);

    var venueCity= venueData["address"]["address_1"];
    var venueURL=venueData["resource_uri"];

    createCalendarInvite(calenderID,eventName,eventStartTime,eventDescription+" Find Venue URL here :- "+venueURL,venueCity);

    output.appendRow([eventName,eventDescription,summary,eventStartTime,genre,costs,venueCity,venueURL]);
  }

}


function createCalendarInvite(calenderID,eventName,eventStartTime,eventDescription,venueCity) {
  var calendarId = calenderID; // Replace with the ID of your target calendar
  var event = CalendarApp.getCalendarById(calendarId).createEvent(eventName, new Date(eventStartTime), new Date(eventStartTime), {
    description: eventDescription,
    location: venueCity
  });
  
  Logger.log('Event ID: ' + event.getId());
}

function getEventIDfromURL(URL) {
  //console.log(URL.match(/\b\d{12}\b/)[0]);
  return URL.match(/\b\d{12}\b/)[0];
}

function getEventDetailsByID(eventID,token) {
	
  var eventbriteUrl = "https://www.eventbriteapi.com/v3/events/" +eventID+"/";
  
  var headers = {
    "Authorization": "Bearer " + token
  };
  
  var response = UrlFetchApp.fetch(eventbriteUrl, { headers: headers });
  var eventData = JSON.parse(response.getContentText());
  
  return eventData;
}

function getVenueDetailsByID(venueID,token) {
	
  var eventbriteUrl = "https://www.eventbriteapi.com/v3/venues/" +venueID+"/";
  
  var headers = {
    "Authorization": "Bearer " + token
  };
  
  var response = UrlFetchApp.fetch(eventbriteUrl, { headers: headers });
  var venueData = JSON.parse(response.getContentText());
  
  return venueData;
}

function arrayToJsonObject(data) {
	var jsonObject = {};
	for (var i = 0; i < data.length; i++) {
		var key = data[i][0];
		var value = data[i][1];
		jsonObject[key] = value;
	}
	return jsonObject
}

function escapeHtml(html) {
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return html.replace(/[&<>"'\/]/g, function (match) {
    return escapeMap[match];
  });
}
