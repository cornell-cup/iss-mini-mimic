function alert(message)
{

}
var ls = require("lightstreamer-client");
var fs = require('fs');
var lsClient = new ls.LightstreamerClient("http://push.lightstreamer.com","ISSLIVE");

lsClient.connectionOptions.setSlowingEnabled(false);

var sub = new ls.Subscription("MERGE",["S0000004"],["TimeStamp","Value"]);

var timeSub = new ls.Subscription('MERGE', 'TIME_000001', ['TimeStamp','Value','Status.Class','Status.Indicator']);

lsClient.subscribe(sub);
lsClient.subscribe(timeSub);

var AOStimestamp = 0.00;
var AOS;
var difference = 0.00;
var unixtime = (new Date).getTime();
var date = new Date(unixtime);
var hours = date.getHours();
var hoursUTC = date.getUTCHours();
var minutes = "0" + date.getMinutes();
var seconds = "0" + date.getSeconds();
console.log("UTC hours " + hoursUTC);
console.log("hours " + hours);
console.log("minutes " + minutes);
var timestmp = new Date().setFullYear(new Date().getFullYear(), 0, 1);
var yearFirstDay = Math.floor(timestmp / 86400000);
var today = Math.ceil((new Date().getTime()) / 86400000);
var dayOfYear = today - yearFirstDay;

var timestampnow = dayOfYear*24 + hoursUTC + minutes/60 + seconds/3600; 
console.log("timestamp now: " + timestampnow);

lsClient.connect();

sub.addListener(
{
  onSubscription: function() 
  {
    console.log("Subscribed");
  },
  onUnsubscription: function() 
  {
    console.log("Unsubscribed");
  },
  onItemUpdate: function(update) 
  {
	console.log(update.getItemName())
	fs.appendFile(update.getItemName()+".txt", update.getValue("TimeStamp") + " " + update.getValue("Value") +  " \n");
  }
});

timeSub.addListener({
  onItemUpdate: function (update) {
    var status = update.getValue('Status.Class');
    AOStimestamp = parseFloat(update.getValue('TimeStamp'));
    difference = timestampnow - AOStimestamp;
        
    if (status === '24') 
	{
          if(difference > 0.00153680542553047)
          {
	     console.log("Stale Signal!")
	     AOS = "Stale Signal";
	     AOSnum = 2;
          }
          else
          {
	     console.log("Signal Acquired!")
	     AOS = "Siqnal Acquired";
	     AOSnum = 1;
          }
	}
	else 
	{
	  console.log("Signal Lost!")
	  AOS = "Signal Lost";
	  AOSnum = 0;
	}
	fs.appendFile("AOS.txt", "AOS " + update.getValue("TimeStamp") + " " + AOSnum + "\n");
  }
});