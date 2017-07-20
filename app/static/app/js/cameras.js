//Javascript code to display camera database on map
//Authors: Deeptanshu Malik, Juncheng Tang

//functions named updateMap_* are used to update the map based on form inputs from webpage
//functions named get* are used to query data from fusion tables
//function populate_dropdown is used to parse data from JSON object obtained by queries sent from get* functions
//--------------------------------------------------------------------------------------------------------------
(function () {

    'use strict';
//tableId - unique id of database fusions table
//col1 - column containing latitude information for camera
//col2 - column containing longitude information for camera
//col3 - city column
//col4 - state column
//col5 - nation column
    var tableId = "14rDkO77Vkn2_wKZSSTEGHACwcFyTzLiPWrAw17jj";
    var locationColumn = "col1";

//Data is obtained from fusion tables by SQL queries
//These queries are sent using HTTP GET requests and a JSON object is returned by fusion tables
//Each query has 3 parts - a url head, the SQL query(encoded as a URL string) and the query tail
//The link below can be referred to understand this further
//https://stackoverflow.com/questions/21497573/fusion-tables-calling-the-api-from-a-browser-using-javascript-uncaught-typee/21511325#21511325

//Note: the callback function's name must be appended as a string to queryTail
//The callback function will be a method to parse the returned JSON object

    var queryUrlHead = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
    var queryUrlTail = '&key=AIzaSyBAJ63zPG5FpAJV9KXBJ6Y1bLKkvzYmhAg&callback=?';

//a variable to track whether state or city data is to be queried from database fusiontable
    var region = '';

//This function is called every time the cameras webpage is loaded
//It initializes a map, overlays a "layer" of data from fusiontables (camera markers) on the map
//and uses DOM properties to track user actions on the webpage

    window.initialize = function () {

        //the code below to initialize map and populate markers on map is obtained using the 'publish' tool from fusiontables
        google.maps.visualRefresh = true;

        var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
            (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));
        if (isMobile) {
            var viewport = document.querySelector("meta[name=viewport]");
            viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
        }

        var mapDiv = document.getElementById('mapCanvas');

        var map = new google.maps.Map(mapDiv, {
            center: new google.maps.LatLng(40.363489, -98.832955),
            zoom: 4,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var layer = new google.maps.FusionTablesLayer({
            map: map,
            heatmap: {enabled: false},
            query: {
                select: locationColumn,
                from: tableId
            },
            options: {
                styleId: 2,
                templateId: 2
            }
        });

        //country, state and city are names for html select tags for the corresponding dropdown menus on html webpage
        //layer - to update data layer from fusion tables according to user requests
        //to understand the code in updateMap* functions - to understand how the map is updated
        //https://developers.google.com/fusiontables/docs/samples/change_query
        google.maps.event.addDomListener($("#country").on("change", function () {
            updateMap_Country(layer, map);
        }));

        google.maps.event.addDomListener($("#state").on("change", function () {
            updateMap_State(layer);
        }));

        google.maps.event.addDomListener($("#city").on("change", function () {
            updateMap_City(layer);
        }));

        if (isMobile) {
            var legend = document.getElementById('googft-legend');
            var legendOpenButton = document.getElementById('googft-legend-open');
            var legendCloseButton = document.getElementById('googft-legend-close');
            legend.style.display = 'none';
            legendOpenButton.style.display = 'block';
            legendCloseButton.style.display = 'block';
            legendOpenButton.onclick = function () {
                legend.style.display = 'block';
                legendOpenButton.style.display = 'none';
            }
            legendCloseButton.onclick = function () {
                legend.style.display = 'none';
                legendOpenButton.style.display = 'block';
            }
        }

        google.maps.event.addDomListener(window, 'load', initialize);
    }

//this funciton formulates and passes queries to updateLayer function based on form inputs on cameras webpage
//See this link for API documentation of formulating query: https://developers.google.com/fusiontables/docs/v2/using#queryData
//See this link for example of how to query fusion table: https://developers.google.com/fusiontables/docs/samples/change_query
    function updateMap_Country(layer, map) {
        //intialise state and city drop down menus to NULL values when no country is selected

        var country = getdata_dropdown("#country");
        var countrylist = $("#country").select2('val');

        //if an option other than All is selected from the country dropdown menu then
        //recenter map and zoom in on selected country
        //to do so send a geocoding request - as explained below
        //https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple?csw=1
        if (country != "('undefined')") {
            updateLayer(layer, "'Nation' IN " + country);

            var countryname = $("#country").select2('data')[0].text;

            //if only one country then recenter on it
            if (countrylist.length == 1)
                center_on_place(countryname, map);
            else
                center_on_world(map);

            //if a country has been selected from the dropdown menu then
            //query database for camera data in its states and city data
            getStateNames();
        }
        //else recenter on world
        else {
            set_dropdown_null("state");
            set_dropdown_null("city");
            ;
            updateLayer(layer, "");
            center_on_world(map);
        }
    }

//this funciton formulates and passes queries to updateLayer function based on form inputs on cameras webpage
//See this link for API documentation of formulating query: https://developers.google.com/fusiontables/docs/v2/using#queryData
//See this link for example of how to query fusion table: https://developers.google.com/fusiontables/docs/samples/change_query
    function updateMap_State(layer) {
        //parse data from drop down menu to format a string in the required format for a SQL query
        var state = getdata_dropdown("#state");

        //if a state other than NULL state is selected then populate markers for cameras only in that state
        //otherwise populate markers for cameras only in the selected country
        if (state != "('')" && state != "('undefined')") {
            updateLayer(layer, "'State' IN " + state);
            getCityNames();
        }
        else {
            set_dropdown_null("city");
            var country = getdata_dropdown("#country");
            updateLayer(layer, "'Nation' IN " + country);
        }
    }

//this funciton formulates and passes queries to updateLayer function based on form inputs on cameras webpage
//See this link for API documentation of formulating query: https://developers.google.com/fusiontables/docs/v2/using#queryData
//See this link for example of how to query fusion table: https://developers.google.com/fusiontables/docs/samples/change_query
    function updateMap_City(layer) {
        var city = getdata_dropdown("#city");
        var state = getdata_dropdown("#state");
        var country = getdata_dropdown("#country");

        //if atleast one city has been selected

        if (city != "('')" && city != "('undefined')") {
            //if atleast one state has been selected
            if (state != "('')" && state != "('undefined')") {
                updateLayer(layer, "'State' IN " + state + " AND  " + "'City' IN " + city);
            }
            else {
                updateLayer(layer, "'Nation' IN" + country + " AND  " + "'City' IN " + city);
            }
        }
        else {
            updateLayer(layer, "'Nation' IN " + country);
        }
    }

    function set_dropdown_null(dropdown_name) {
        $("#" + dropdown_name).select2('val', '[]');
        document.getElementById(dropdown_name).innerHTML = '[]';
    }

//layer -> fusion tables layer on map to update
//filtering_condition -> a SQL like query to obtained filtered data from fusiontables
//See this link for API documentation of formulating query: https://developers.google.com/fusiontables/docs/v2/using#queryData
//See this link for example of how to query fusion table: https://developers.google.com/fusiontables/docs/samples/change_query
    function updateLayer(layer, filtering_condition) {
        layer.setOptions({
            query: {
                select: locationColumn,
                from: tableId,
                where: filtering_condition
            }
        });
    }

    function center_on_world(map) {
        map.setCenter(new google.maps.LatLng(40.363489, -98.832955));
        map.setZoom(2);
    }

//using geocoder to center map on country selected
    function center_on_place(place_name, map) {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address': place_name}, function (results, status) {
            while (status != google.maps.GeocoderStatus.OK) {
            }
            map.setCenter(results[0].geometry.location);
            map.fitBounds(results[0].geometry.viewport);
        });
    }

//parse data from drop down menu to format a string in the required format for a SQL query
    function getdata_dropdown(dropdown_name) {
        var data_array = $(dropdown_name).select2('val');
        var data = '(';
        for (var i = data_array.length - 1; i > 0; i--) {
            data += "'" + data_array[i] + "'" + ','
        }
        data += "'" + data_array[0] + "'" + ')'

        return data;
    }

//This function
// if USA is the selected country
// 1) updates region and 2)queries fusion tables
// else it calls the getCityNames functions
    function getStateNames() {
        // set the query using the parameters

        var country = getdata_dropdown("#country");
        var countrylist = $("#country").select2('val');
        if ($.inArray( "USA", countrylist ) != -1){

            document.getElementById('state').isDisabled = false;
            document.getElementById('city').isDisabled = true;
            region = 'state';
            var encodedQuery = get_encodedQuery('State');
            sendRequest(encodedQuery);
        }
        else {
            set_dropdown_null("state");
            document.getElementById('state').isDisabled = true;
            getCityNames();

        }
    }

//This function 1) updates region and 2) queries fusion tables
    function getCityNames() {
        document.getElementById('city').isDisabled = false;
        region = 'city';
        var encodedQuery = get_encodedQuery('City');
        sendRequest(encodedQuery);
    }

//query fusiontables database using SQL
//set the query from html form as explained here:
//https://developers.google.com/fusiontables/docs/v2/using#queryData
//Tip: use fusiontables website and set filter conitions on data using its user friendly interface
//then use 'publish' tool to see the correct query and thus, understand how to code it
    function get_encodedQuery(data) {
        //var country = document.getElementById('country').value;
        var state = getdata_dropdown("#state");
        var country = getdata_dropdown("#country");

        // set the query using the parameters
        var FT_Query = "SELECT '" + data + "' " + "FROM " + tableId;

        if (state != "('undefined')" && state != "('')")
            FT_Query += " WHERE 'State' IN " + state;
        else if (country != "('undefined')" && country != "('')")
            FT_Query += " WHERE 'Nation' IN " + country;

        FT_Query += " group by '" + data + "'";

        return encodeURIComponent(FT_Query);
    }

    // Send the JSONP request using jQuery
    function sendRequest(encodedQuery){
        $.ajax({
            url: queryUrlHead + encodedQuery + queryUrlTail,
            dataType: 'jsonp',
            success: function (response) {
                populate_dropdown(response);
            }
        });
    }

    //function to populate dropdown menus based on JSON returned by sql like query to fusion table
    function populate_dropdown(response) {
        //if the returned JSON object doesn't have a rows keys then it means that an error has occurred
        if (!response.rows) {
            return;
        }

        //number of data items to populate
        var numRows = response.rows.length;

        var Names = {};
        for (var i = 0; i < numRows; i++) {
            var name = response.rows[i][0];
            Names[name] = name;
        }

        var dropdown_list = "<select name='data_select' onchange='handleSelected(this)'>"
        for (name in Names) {
            dropdown_list += "<option value='" + name + "'>" + name + "</option>"
        }
        dropdown_list += "</select>"
        document.getElementById(region).innerHTML = dropdown_list;
    }

})();