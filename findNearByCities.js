var geo = require("geolib")
var http = require("http")

var findCities = function(coordinateInfo,callback) {
    var responseStyle = 'short';
    var citySize = 'cities5000';
    var radius = 3;
    var maxRows = 30;
    var username = 'shasha99';
    
    console.log(coordinateInfo);
    var finalExtractedCitiesList = [];
    var temperorayCitiestList = {};
    var completed_requests = 0;
    
     temperorayCitiestList[coordinateInfo.source]=0;
     finalExtractedCitiesList.push(coordinateInfo.source);
                
    for (var i = 0; i < coordinateInfo.diversions.length; i++) {
        var lat = coordinateInfo.diversions[i].lat;
        var long = coordinateInfo.diversions[i].lng;
        //console.log("For "+lat+" "+long+" :");
        var url = '/findNearbyPlaceNameJSON?lat=' + lat + '&lng=' + long + '&style=' + responseStyle + '&cities=' + citySize + '&radius=' + radius + '&maxRows=' + maxRows + '&username=' + username;
        var options = {
            host: 'api.geonames.org',
            path: url
        };

        http.request(options, function(response) {
            var data = '';

            response.on('data', function(chunck) {
                data += chunck;
            });

            response.on('end', function() {
                completed_requests++;
                data = JSON.parse(data);
                
                console.log("For lat=" + lat + " and long=" + long + ":");
                if (data.geonames.length == 0) {
                    console.log("No cities found");
                } else {
                    for (var i = 0; i < data.geonames.length; i++) {
                        console.log(data.geonames[i].name);
                        //finalExtractedCitiesList.push(data.geonames[i].name);
                        if(temperorayCitiestList[data.geonames[i].name] === undefined){
                            temperorayCitiestList[data.geonames[i].name] = completed_requests;
                            finalExtractedCitiesList.push(data.geonames[i].name);
                        }
                    }
                }
                
                if(coordinateInfo.diversions.length === completed_requests){
                    if(temperorayCitiestList[coordinateInfo.destination]===undefined){
                        finalExtractedCitiesList.push(coordinateInfo.destination);
                    }
                    console.log('All request got completed. All cities are following :');
                    console.log(finalExtractedCitiesList);
                    delete temperorayCitiestList;
                    callback(finalExtractedCitiesList);
                }
            });

            response.on('error', function(err) {
                callback(err);
                console.log('Error while fetching cities');
            });

        }).end();

    }
    
}

var findLatLong = function(source,destination,callback){
    
    var mode="Driving";
    var url="/maps/api/directions/json?";
    url+="origin="+source+"&destination="+destination+"&mode="+mode;

    var options={
        host: 'maps.googleapis.com',
        path: url
    };

    console.log(url);

    http.request(options,function(response){
        
        var data='';
        console.log("Requesting data");
        response.on('data',function(chunk){
            data+=chunk;
        });

        response.on('end',function(){
            data=JSON.parse(data);
            var steps = data.routes[0].legs[0].steps;
            var latlng = [];
            for( var location = 0 ; location < steps.length ; location++){
                latlng.push(steps[location].start_location);
            }
            callback(latlng);
        });

        response.on('error',function(err){
            console.log("Got the error",err);
            callback(err);
        });

    }).end();
}


var getNearByCities = function(callback){
    
    this.source = "Shimla";
    this.destination = "Manali";
    
    this.onLatitudeLongitudeReceive = function(latlng){
        findCities({source : this.destination, destination : this.destination,
                    diversions : latlng}, this.onCitiesListFound.bind(this));
    };
    
    this.onCitiesListFound = function(cities){
        callback(cities);
    }
    
    findLatLong(this.source, this.destination , this.onLatitudeLongitudeReceive.bind(this));
  
}

getNearByCities(console.log);


module.exports = {
    getNearByCities : getNearByCities
}
