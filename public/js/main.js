function findStation(pos){
      $("#status").text("Locating Stations, Getting Train Times");
      var distance = [];
      var stops = [];
      $.ajax({
          type : "GET",
          url : "/getcsvjson?file=stops",
          success : function(data){
            for(var i = 0;i<data.length;i++)
            {
              if(data[i].parent_station == ""){
                //var dist_to_stop = getDistance(40.692578, -73.992528, data[i].stop_lat, data[i].stop_lon)
                var dist_to_stop = getDistance(pos.coords.latitude, pos.coords.longitude, data[i].stop_lat, data[i].stop_lon)
               
                  distance.push({
                        stop_id : data[i].stop_id,
                        stop_name : data[i].stop_name,
                        dist   : dist_to_stop
                      });
                if(distance[distance.length-1].dist < .5){
                    stops.push(distance[distance.length-1]);
                }
              }
            }
            //Get 4 closest stops if none within half mile
            if(stops.length == 0)
            {
             stops = findMaxVals(distance);
            }
            stops.sort(compareDistance);
            for(var k = 0;k<stops.length;k++){
              //$('.stop-results').append("<p> Closest Stop: " + stops[k].stop_name + "<br /> Distance from You: " + stops[k].dist.toFixed(2)  + " mi </p>");
              console.log("Closest Stop: " + stops[k].stop_name + " - Distance from You: " + stops[k].dist.toFixed(2));
            }
            findStopTimes(stops);
          }
        });
      
    }

    function findMaxVals(arr){
      var output = [];
      arr = arr.sort(compareDistance);
      for(var i = 0;i<4;i++)
      {
        output.push(
                      arr[i]
                    );
      }
      return output;
    }

    //takes in two sets of points and returns distance
    function getDistance(lat1, lon1, lat2, lon2){
        var radlat1 = Math.PI * lat1/180
        var radlat2 = Math.PI * lat2/180
        var radlon1 = Math.PI * lon1/180
        var radlon2 = Math.PI * lon2/180
        var theta = lon1-lon2
        var radtheta = Math.PI * theta/180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180/Math.PI
        dist = dist * 60 * 1.1515
        return dist
    } 


    function findStopTimes(stops){
      var stopresults = [];    
      for(var i = 0;i<stops.length;i++){
        stopTimesAJAX(stops[i],i);
      }
    }

    function stopTimesAJAX(stop, index)
    {
       $.ajax({
          type : "GET",
          url : "/getstoptimes?stopid=" + stop.stop_id + "N", 
          success : function(data){
            TrainData(stop,data, "N");
          }
        });
         $.ajax({
          type : "GET",
          url : "/getstoptimes?stopid=" + stop.stop_id + "S", 
          success : function(data){
            TrainData(stop,data, "S");
          }
        }); 
    }

    var deferreds = [];
    var results = {};

    function TrainData(stops,stopinfo, direction)
    {
      var stopid=stopinfo[0].stop_id;
      var output = [];
      results[stopid] = [];
      for(var i = 0;i<stopinfo.length;i++)
      {
        var json = {station : "", trains : []};
        var dObject = new $.Deferred();
        deferreds.push(dObject);
        findTrips(stopinfo[i].trip_id, dObject, stopid);
        

      }
      $.when.apply($, deferreds).done(function() {
        var output = results[stopid];
        printOutput(stopinfo, output, stops, direction);
        deferred = [];
      });
    }

    function findTrips(id, dObject, stopid)
    {
      $.ajax({
          type : "GET",
          url : "/gettrips?tripid=" + id,
          success : function(data){
              results[stopid].push(data[0]);
              dObject.resolve();

          }
        });
    }

    function printOutput(traintimes,traininfo,station, direction){

      $('#status').fadeOut(function(){
        if(direction == "S"){
            $('.stop-results').append('<div class="row station" id="' + traintimes[0].stop_id + '"><div class="col-md-6">' + station.stop_name
          + ' - South</div><div class="col-md-6">' + station.dist.toFixed(2)
          + ' mi </div>');
        }
        else{
            $('.stop-results').append('<div class="row station" id="' + traintimes[0].stop_id + '"><div class="col-md-6">' + station.stop_name
            + ' - North</div><div class="col-md-6">' + station.dist.toFixed(2)
            + ' mi </div>');
        }
        console.log(traintimes[0].stop_id + " Station Printed");
        var trains = sortTrains(traintimes,traininfo, "service_id");
        var dayofweek = moment().format("ddd").toUpperCase();
        console.log(trains);
        var selector = $('#' + traintimes[0].stop_id + '');
        for(var item in trains)
        {
          if(item.indexOf(dayofweek) != -1){
            for(var i = 0;i<trains[item].length;i++){
                trains[item].sort(compareTime);
                printTrain(trains[item][i]);
                console.log(trains[item][i].route_id + ":" + trains[item][i].trip_headsign + ":" + trains[item][i].arrival_time);
               }
          }
          else if(item.indexOf("WKD") != -1 && dayofweek != "SAT" && dayofweek != "SUN"){
               trains[item].sort(compareTime);
               console.log(trains[item]);
               for(var i = 0;i<trains[item].length;i++){
                printTrain(trains[item][i], selector);
                console.log(trains[item][i].arrival_time.diff(moment(), 'minutes'));
                console.log(trains[item][i].arrival_time.format("HH:mm:ss"));
                console.log(trains[item][i].route_id + ":" + trains[item][i].trip_headsign + ":" + trains[item][i].arrival_time);
               }
          }

         
        }
      });
     
      //console.log(trains);
    }

    function printTrain(train, selector){
      selector.after('<div class="row train-' + train.route_id + '"><div class="col-md-4">' +
            train.route_id + '</div><div class="col-md-4">' + train.trip_headsign + '</div><div class="col-md-4"> Arriving in ' + 
            train.arrival_time.diff(moment(), 'minutes') + ' minutes</div></div>');
      console.log(train.stop_id + " printed!")
    }

    function sortTrains(times, info, id)
    {
      var trains = {};
        for(var i = 0;i<times.length;i++){
          var id = info[i].service_id;          
          if(!inObject(trains,id)){
             trains[id] = [];
          }
          trains[id].push({
              "arrival_time": moment(times[i].arrival_time,"HH:mm:ss"),
              "stop_id" : times[i].stop_id,
              "trip_headsign" : info[i].trip_headsign,
              "route_id" : info[i].route_id,
              "trip_id" : info[i].trip_id
            });
        }
        return trains;
    }

    function inObject(obj,item){
      for(var k in obj){
        if(k === item)
        {
          return true;
        }
      }
      return false;
    }

    function compareDistance(a, b) {
      return a.dist -  b.dist;
    }

    function compareTime(a, b) {
      return b.arrival_time.diff(moment(), 'minutes') - a.arrival_time.diff(moment(), 'minutes');
    }