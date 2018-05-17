// TT-3000 LoL Auto Songbooster v1.0.0
// David Grey, 
// May 4, 2018
// Description: Website to take summoner name input->get summoner id->get current game info->get
//  team champs->randomly select one champ->generate pre-defined song boost link for that champ. 


// DEVELOPMENT INSTRUCTIONS (Windows)
// Install node.js in windows https://nodejs.org/en/download/
// In cmd type npm install request
// Run the program:
//    Add javascript build to sublime text: https://pawelgrzybek.com/javascript-console-in-sublime-text/
//    press ctrl+b to run program in sublime text
//  OR 
//    in cmd navigate to the directory of your .js file
//    in cmd run node api_get_data.js
// In chrome, type http://localhost:1339/ or http://127.0.0.1:1339/ and press enter
// Note: if you try to run 


// HELPFUL REFERENCES: 
// HTML Client side inside of server side js file: http://techslides.com/client-side-javascript-to-node-js
// Getting variables from ajax request: https://stackoverflow.com/questions/15211186/getting-variable-out-of-a-get-ajax-call?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
// Pulling all instances of a string in a string (regex): https://stackoverflow.com/questions/3365902/search-for-all-instances-of-a-string-inside-a-string 


// TASKLIST (Immediate)
// - Team ID comes up correctly in test.js, but not in auto_boost.js
// - 50% chance it might boost the wrong team. I pull the first 5 champ id's from the game data, without realizing that might be the other team. (you are either 1-5 or 6-10)
// - Figure out how to extra data (summ_id, line 182) out of calc function to a usable variable
// - Pull song link from csv file or database
// - Post song link (or embed video? or open in new window?)
// -

// TASKLIST (Backburner & Feature upgrades)
// - checkbox to omit Vitas (champs without a designated song)
// - tick counter at bottom of page to show (decimal) millions of customers served
// - add error handling (if exceed api request limits, invalid data, etc)
//
// ******************************************* VARIABLES ***********************************



var http = require('http'); 
var request = require('request');
var url_summ_id = "blank";



// ******************************************* USER INPUT FORM ********************************
// Create a function to handle every HTTP request
function handler(req, res){

  var form = '';

  if(req.method == "GET"){ 
    
    form = '<!doctype html> \
<html lang="en"> \
<head> \
    <meta charset="UTF-8">  \
    <title>LoL Song Boost</title> \
    <body style="background-color: #000;}">\
</head> \
<body> \
<!--*********************************************** STYLE ********************************************-->\
<style>\
  p {\
    color: #00FF80;\
    font-family: "Courier New", Courier, monospace;\
    font-size: 100%;\
    text-align: center;\
}\
\
  input[type=text] {\
    outline: none;\
    font-family: "Courier New", Courier, monospace;\
    padding: 2px 2px;\
    margin: 4px 0;\
    box-sizing: border-box;\
    border: 2px solid #00FF80;\
    background-color: #000;\
    color: #00FF80;\
    text-align: center;\
}\
input:-webkit-autofill {\
    -webkit-box-shadow: 0 0 0px 1000px black inset;\
    -webkit-text-fill-color: green !important;\
}\
\
.button1 {\
    font-family: "Courier New", Courier, monospace;\
    padding: 15px 32px;\
    text-align: center;\
    display:inline-block;\
    margin: 4px 2px;\
    background-color: #000; \
    color: #00FF80; \
    border: 2px solid #00FF80;\
    cursor: pointer;\
}\
\
</style>\
<!--*********************************************** PROGRAM ********************************************-->\
  <form name="myForm" action="" onsubmit="return ajax();"method="post">\
      <br>\
      <p> summoner name: <input type="text" name="A"> </p> \
      <p> rito api key: <input type="text" name="B"> </p>\
      <br>\
      <p> <input type="submit" class="button1" value="song boost!"> </p>\
      <p> <span id="result"></span> </p> \
      <P> <span id="result2"></span> </p> \
  </form> \
  <script> \
    function ajax(){ \
      var a = document.forms["myForm"]["A"].value; \
      var b = document.forms["myForm"]["B"].value; \
      var formdata = a+"&"+b; \
      \
      xmlhttp = new XMLHttpRequest(); \
      xmlhttp.onreadystatechange=function(){ \
        if(xmlhttp.readyState==4 && xmlhttp.status==200){ \
          document.getElementById("result").innerHTML=xmlhttp.responseText; \
        }; \
      }; \
      xmlhttp.open("POST","",true); \
      xmlhttp.send(formdata); \
      return false; \
    } \
  </script> \
</body> \
</html>';

// *********************************************** END HTML ********************************************
  //respond
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end(form);
  

  } else if(req.method == 'POST'){

    //read form data
    req.on('data', function(chunk) {

      //grab form data as string
      var formdata = chunk.toString();

      //grab A and B values
      var a = formdata.split("&")[0];
      var b = formdata.split("&")[1];
      //replace spaces with %20 so url will work. E.g., Pro Poop Eater would be Pro%20Poop%20Eater
      //g flag is to replace all instances
      var a_mod = a.replace(/ /g, "%20");



      result = get_api_data(a,a_mod,b);
      // console.log("result is:" + result);

      //fill in the result and form values
      form = result.toString();

      //respond
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(form);

    });

  } else {
    res.writeHead(200);
    res.end();
  };

};

// *********************************************** GET API DATA ********************************************
// *********************************************** STEP 1 - SUMM ID ****************************************
function get_api_data(a,a_mod,b)
{
  url_summ_id = 'https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/' + a_mod + '?api_key=' + b;

  request(url_summ_id, function(err, resp, html)
    {
        if (!err)
        {
         //log the data from the request
          // console.log("\n Data from API request: ");
          // console.log(html); 

          //Parse the data
          obj = JSON.parse(html);

          //extract the summoner ID from the data & set to a variable
          console.log("\nSummoner ID: ");
          summ_id = obj.id;
          console.log(summ_id);



// ******************************* STEP 2 - GAME INFO TO CHAMP ID'S TO RANDOM CHAMP ID ****************************************
          url_game_data='https://na1.api.riotgames.com/lol/spectator/v3/active-games/by-summoner/'+ summ_id + '?api_key=' + b;

          request(url_game_data, function(err, resp, html2)
            {
                if (!err)
                {
                 //log the data from the request
                  // console.log("\n Data from API request: ");
                  // console.log(html2); 

                  //Parse the data
                  json_obj2 = JSON.parse(html2);

                  // turn json data into a string
                  var json_string = JSON.stringify(json_obj2)

                  // ************************************* GET TEAM NUMBER ****************************************
                  // find out what team you are on
                  //EXTRACT EVERTHING FROM BEGINNING TO SUMMONER NAME
                  var chop1 = json_string.substr(0, json_string.indexOf(a));
                  // GET START/END INDEXES FOR TEAM ID and add or subtract to get only the team number. 
                  var index_start = chop1.lastIndexOf("teamId") + 8;
                  // CREATE 2ND INDEX FOR DIGITS AFTER TEAMID 
                  var index_end = chop1.lastIndexOf("spell1Id") - 2;
                  // EXTRACT TEAM ID
                  var team_ID = chop1.slice(index_start,index_end);
                  console.log("Team ID: " + team_ID);
                  // might be useful for pulling a string out of an array
                  // splitString[1];
// ************************************** END TEAM GET NUMBER************************************

// ************************************* GET CHAMP ID'S ON TEAM *********************************
                  if (team_ID == "100"){
                    console.log("(blue team)")
                    var purple_start = json_string.indexOf("teamId\":" + team_ID)
                    var purple_end = json_string.indexOf("teamId\":200")
                    json_team = json_string.slice(purple_start,purple_end);
                    // console.log(json_purple);
                  }
                  else if (team_ID == "200"){
                    console.log("purple team")
                    var blue_start = json_string.indexOf("teamId\":" + team_ID)
                    var blue_end = json_string.indexOf("observers")
                    json_team = json_string.slice(blue_start,blue_end);
                  }
                  else{
                    console.log("not a valid team number")
                  }
// ********************************* END CHAMP ID'S ON TEAM ************************

                  // ************************************* GET CHAMP NUMBERS ****************************************
                  let tryhard_team = json_team.match(/championId":\d\d?\d?/g);
                  random_champ_str = tryhard_team[Math.floor(Math.random()*tryhard_team.length)];
                  random_champ_id = random_champ_str.replace(/\D/g,'');
                  console.log("Random Champ ID: " + random_champ_id);
                  // ************************************* END GET CHAMP NUMBERS ****************************************

// ***************************** STEP 3 - GET CHAMP NAME FROM RANDOM ID **************************
                  url_champ_name = 'https://na1.api.riotgames.com/lol/static-data/v3/champions/' + random_champ_id + '?locale=en_US&api_key=' + b;

                  request(url_champ_name, function(err, resp, html3)
                  {
                      if (!err)
                      {
                        //Parse the data
                        obj3 = JSON.parse(html3);
                        champ_name = obj3.name;
                        console.log("\nChampion: " + champ_name + " Gets the boost");
                        console.log(summ_id);

                      }
                  });

// ***************************** STEP 3 - END STEP 3**********************************************


                }
              });

        }
    });

  return  "Output to client: Summoner Name: " + a + " API_KEY: " + b;

}




// Create a server that invokes the `handler` function upon receiving a request
http.createServer(handler).listen(1339, function(err){
  if(err){
    console.log('Error starting http server');
  } else {
    console.log("Server running at http://127.0.0.1:1339/ or http://localhost:1339/");
  };
});


