
//required node packages
var inquirer = require("inquirer");
var moment = require("moment");
var fs = require("fs");
var Twitter = require('twitter');
var spotify = require('spotify-web-api-node');
var request = require("request");
//setting new client for handling Twitter requests
var twitKeys = require("./twitter_keys.js");
var client = new Twitter(twitKeys);
//getting keys for spotify
var spotifyAPI = require("./spotify_keys.js");

//Greeting message
console.log("+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*"+
			"\nWelcome, my name is Liri. I'm your personal Node assistant!"+
			"\n+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*");

//used in opening inquirer and allows me to easily execute the right function
var choices = ["twitter","spotify","omdb","twilio","random"];
//twitter does searches by either a user specified user name or keyword
//spotify does searches by a user specified artist, album or song or allows a default song browser if the user does not provide a song name of looking up My Way (intended to Frank Sinatra's My Way)
//omdb does searches of movies with user providing a movie name

//userChoice can run multiple times but the message the first time should be different than the message on the second and later iterations
//as you can see below, the first time this function is executed, the message asks "what do you want to do today?" - on later iterationso the message is what else can I help you with? thus recognizing that this is not the first task
function userChoice(message){	
	//i want to only have the user be able to only select one option from the list of twitter, spotify, omdb and twilio
	//so I use prompt type list
	//then depending on the answer I have the correct function executed by seeing which index element of the choices array above that the user chose
	inquirer.prompt([{name:"inqChoice",message:message,choices:choices,type:"list"}]).then(function(response){
		if(choices.indexOf(response.inqChoice)==0){
			tweeter(1);
		} else if(choices.indexOf(response.inqChoice)==1){
			spotifyChooseSearch();
		} else if(choices.indexOf(response.inqChoice)==2){
			OMDBer();
		} else if (choices.indexOf(response.inqChoice)==3){
			twilioer("Please specify the number you want to send a text message to");
		} else if (choices.indexOf(response.inqChoice)==4){
			readTxtAndDo();
		}

	});

}

userChoice("What do you want to do today?");//start program

function doAnotherAction(){//runs after any action has run through completely
//asks user if they want to run another action through inquirer prompt
//writes to a log file that the user has either not decided to perform another function or that they have
	inquirer.prompt([{name:"yesNo",message:"Do you want to do another action?",choices:["yes","no"],type:"list"}]).then(function(response){
		var statement = response.yesNo=="yes"? "What else can I help you with today?" : "Thank you! Have a nice day!";
		if(response.yesNo=="yes"){
			fs.appendFile("log.txt","\nUser chose to perform another activity;\n--**--**--**--**--**--**--**--**--**--**--**--**--**",function(err){});
				userChoice(statement);
		} else {
			console.log(statement);
			fs.appendFile("log.txt","\nUser chose not to perform another activity;\n--**--**--**--**--**--**--**--**--**--**--**--**--**",function(err){});
		}
	})

}
//random function that reads from text file random.txt and interprets what is on that file
function readTxtAndDo(){//for reading function from text file
	fs.readFile("random.txt","utf8",function(error,data){
		
		var operation = data.split(",");
		var operator = operation[0];
		var argument = operation.slice(1,operation.length).join(" ").replace(/"/g,"");

		//arguments need to come in the form of spotify,<song name> OR twitter,<screen name> OR omdb,<movie title>
		//argument does not need to be in "". you simply need to separate operator from argument by a ","
		//I didn't build twilio to do this but since Twilio was my own option to include and the other three work, I believe what I have done is more than sufficient

		if(operation[0] == "twitter"){//if first part of file is twitter
			console.log("Search for tweets for screen_name: " + argument);//prints to console that the search is for tweets by a certain screen name
			tweeter(2,argument);
		} else if(operation[0] == "spotify"){//same kind of thing for spotify
			console.log("Search for song: " + argument);
			spotifySongSearch(argument,true);
		} else if(operation[0] == "omdb"){//same kind of thing for omdb
			console.log("Search for show: " + argument);
			OMDBer(argument,"\nOMDB action triggered by random.txt;\n--**--**--**--**--**--**--**--**--**--**--**--**--**");
		} else {//anything else prints that the command in the file was unknown
			console.log("random.txt contains an unknown command! please fix this and try again.")
		}

	});

}

function tweeter(method,screenName){//"hub" function for twitter actions
	//method (1) is for allowing user to specify what they want to search by by going through inquirer prompts
	//method (2) is what will run when the user requests random and the data for the twitter actions is on the random.txt file
	if(method == 1){
		inquirer.prompt([{name:"twChoice",message:"What do you want to search by?",choices:["screen name","keyword"],type:"list"}]).then(function(response1){
			//ask user if they want to run a search on tweets by screen name or search tweets by keyword
			if(response1.twChoice=="screen name"){	
				//prompts user to specify screen name and then does search and writes to log
				inquirer.prompt([{name:"screen_name",message:"Please enter a twitter screen name",type:"input"}]).then(function(response2){//my created screen name is spenalran
					twittByName(response2.screen_name);
					fs.appendFile("log.txt","\nUser performed twitter search by user screen name\nsearched for tweets by user: " + response2.screen_name + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**",function(err){});
				});
			} else {
				//prompts user to specify key word and then does search and writes to log
				inquirer.prompt([{name:"keyword",message:"Please enter a topic to search",type:"input"}]).then(function(response2){
					twittByKeyW(response2.keyword);
					fs.appendFile("log.txt","\nUser performed twitter search by keyword\nsearched for tweets by keyword: " + response2.keyword + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**",function(err){});
				});
			}
		});
	} else { 
		twittByName(screenName);
		fs.appendFile("log.txt","\nTwitter search by user screen name triggered by random.txt",function(err){});
	}
}
//function for searching by screenname
function twittByName(screenName){
	var params = {screen_name: screenName};//passed to twitter get function to specify that the search should be screen name
	client.get('statuses/user_timeline', params, function(error, tweets, response_tw) {
	  if (!error) {
	    for (var i = 0 ; i < tweets.length ; i++ ) {
	    	//creates a string to print to console
	    	var statement = "--------------------------------------";
	    	statement += "\nTweet # " + (i+1) + ":";
	    	statement += "\n" + tweets[i].created_at 
	    	statement += "\n" + tweets[i].text;
			console.log(statement);
	    }
	    doAnotherAction();//runs the function asking user if they want to do another action which then depending on answer will either quit program or run the user choice function again
	  } else {//if error, prints that the user does not exist - I like this more than the returned error from the get function
	  	console.log("Error: That user does not exist!");
	  	tweeter(1);
	  }	
	});
}

//function for searching by keyword
function twittByKeyW(keyword){
	var params = {q: keyword};//passed to twitter get function to specify that the search should be keyword
	client.get("search/tweets",params,function(error, tweets, response_tw){
		var tweetArray = tweets.statuses;
		for ( var i = 0 ; i < tweetArray.length ; i++){
			var statement = "--------------------------------------";
			statement += "\nAt " + tweetArray[i].created_at;
			statement += "\n" + tweetArray[i].user.screen_name + " wrote: ";
			statement += "\n" + tweetArray[i].text;
			console.log(statement);
		}
		doAnotherAction();//runs the function asking user if they want to do another action which then depending on answer will either quit program or run the user choice function again
	})
}

//search function for spotify - inquirer to ask search by band, album or song
//inquirer then takes that answer and asks for specific search for band, album or song (supply name that you want to search)
function spotifyChooseSearch(){
	inquirer.prompt([{name:"typeofSearch",message:"Please choose whether you want to search for - a band, an album or a song",choices:["band","album","song"],type:"list"}]).then(function(response1){
		if(response1.typeofSearch.length==0){spotifyChooseSearch();} else {			
			inquirer.prompt([{name:"query",message:"Please enter the name of the "+response1.typeofSearch+" that you would like to search for.",type:"input"}]).then(function(response2){
				if(response2.query.length==0 && response1.typeofSearch != "song"){spotifyChooseSearch();} else {
					if(response1.typeofSearch=="band"){//then it runs the appropriate function - search by band, search by album, search by song
						spotifyBandSearch(response2.query);
					} else if(response1.typeofSearch=="album"){
						spotifyAlbumSearch(response2.query);
					} else if(response1.typeofSearch=="song"){
						spotifySongSearch(response2.query);					
					}
				}
			});
		}
	});
}

//search by band
function spotifyBandSearch(bandName){
	spotifyAPI.clientCredentialsGrant()
	.then(function(data) {
	    // Save the access token so that it's used in future calls
	    spotifyAPI.setAccessToken(data.body['access_token']);
	    return spotifyAPI.searchArtists(bandName)//performs api search for band name
	}, function(err) {
	    console.log('Something went wrong when retrieving an access token', err.message);
	}).then(function(data){
		var artistResults = data.body.artists.items;
		var artists = [];//often times the result of the search will return multiple bands with the name
		//for instance, if you search for saxophonist Charlie Parker, you'd get Charlie Parker, Charlie Parker Quintet, Charlie Parker Quartet and a bunch of other names
		//so I'm building this so that the user can specify the specific result that they want
		//I do this by passing all of the results to an artists array, which I then present as an inquirer prompt list
		var selectedAlbum,selectedArtist;

		for ( var i = 0 ; i < artistResults.length ; i++ ) {
			artists.push(artistResults[i].name);
		}

		inquirer.prompt([{name:"artistChoice",message:"Below is a list of returned artists. Choose an artist to see their albums.",choices:artists,type:"list"}]).then(function(response3){
			selectedArtist = response3.artistChoice;
			return spotifyAPI.searchAlbums("artist:" + response3.artistChoice)//the chosen album is then searched for and returned
		}).then(function(data2){//the value returned from searchAlbums allows me to use a second .then function which I can then put the resulting data into to do stuff with
			var artistDisco = data2.body.albums.items;
			var artistDiscoID = [];//the ids are important because this allows future exact searches to occur based on what the user has specified as their intended search
			//below I push the attribute id for the albums.items objects to this array - these are unique keys for the different albums that are necessary in order to retrieve the proper album's tracks
			var albums = [];
			for ( var i = 0 ; i < artistDisco.length ; i++ ){
				albums.push(artistDisco[i].name);
				artistDiscoID.push(artistDisco[i].id);
			}
			inquirer.prompt([{name:"albumChoice",message:"Below is a list of returned albums. Choose one to see the album's songs.",choices:albums,type:"list"}]).then(function(response4){
				selectedAlbum = response4.albumChoice;//get album name chosen by user
				var selectedAlbumElement = albums.indexOf(response4.albumChoice);//find which element of the albums index was chosen
				var selectedAlbumElementID = artistDiscoID[selectedAlbumElement];//get the id for this album from the id array
				return spotifyAPI.getAlbumTracks(selectedAlbumElementID)//search bsed on that id for album tracks
			}).then(function(data3){//this is data returned from the spotifyAPI.getAlbumTracks request
				console.log("Here is a list of the songs on " + selectedAlbum + " recorded by " + selectedArtist + ".");
				var albumTracks = data3.body.items;
				for ( var i = 0 ; i < albumTracks.length ; i++){//print out the returned song list
					var statement = "-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-";
					statement += "\nSong name: " + albumTracks[i].name;
					statement += "\nDisc #: " + albumTracks[i].disc_number;
					statement += "\nTrack #: " + albumTracks[i].track_number;
					var minutes = Math.floor(albumTracks[i].duration_ms/(60*1000)) % 60;
					var seconds = Math.floor(albumTracks[i].duration_ms/1000) % 60;
					statement += "\nDuration: " + minutes + " min, " + seconds + " sec";
					statement += "\nLink:" + albumTracks[i].external_urls.spotify;
					console.log(statement);
				}

				var appendStatement = "\nnew spotify action;";//print to log file
				appendStatement += "\nuser searched: band;";
				appendStatement += "\nuser specified band: " +bandName + ";";
				appendStatement += "\nuser chose result \"" + bandName + "\" and viewed tracks for album \"" + selectedAlbum + "\";";
				var time = "\n" + moment().format().replace("T"," ") + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
				appendStatement += time;
				fs.appendFile("log.txt",appendStatement,function(err){doAnotherAction();});
			});
		});
	});
}

//function for searching by album
function spotifyAlbumSearch(albumName){
	spotifyAPI.clientCredentialsGrant()//send credentials and perform a spotify search on album
	.then(function(data) {
	    // Save the access token so that it's used in future calls
	    spotifyAPI.setAccessToken(data.body['access_token']);
	    return spotifyAPI.searchAlbums(albumName)
	}, function(err) {
	    console.log('Something went wrong when retrieving an access token', err.message);
	}).then(function(data){
		var artists = [];
		var albumResults = data.body.albums.items;
		var albumIDs = [];
		for ( var i = 0 ; i < albumResults.length; i ++ ) {//push artists and albums returned for album search to artists array and push album ids to albumids array for same purpose as in the artist function
			artists.push(albumResults[i].artists[0].name + " - " + albumResults[i].name);
			albumIDs.push(albumResults[i].id);
		}
		var selectedArtistAlbum;
		//prompt user to choose from resulting artist, album list
		inquirer.prompt([{name:"artistAlbum",message:"Here are the results of the album search. Please choose the artist - album that you would like to search.",choices:artists,type:"list"}]).then(function(response3){
			selectedArtistAlbum = response3.artistAlbum;
			var selectedAlbumElement = artists.indexOf(response3.artistAlbum);//get index element of user's choice in the artists array
			var selectedAlbumElementID = albumIDs[selectedAlbumElement];//get album id
			return spotifyAPI.getAlbumTracks(selectedAlbumElementID)//search for album tracks with that id
		}).then(function(data2){//this is the result of the returned result from the function getAlbumTracks above
			var albumTracks = data2.body.items;
			console.log("Here are the tracks for " + selectedArtistAlbum + ":")//print to screen the tracks for the album
			for ( var i = 0 ; i < albumTracks.length ; i++){
				var minutes = Math.floor(albumTracks[i].duration_ms/(60*1000)) % 60;
				var seconds = Math.floor(albumTracks[i].duration_ms/1000) % 60;
				var statement = ":::::::::::::::::::::::::::::::::";
				statement += "\nSong Name: " + albumTracks[i].name;
				statement += "\nDisc Number: " + albumTracks[i].disc_number;
				statement += "\nTrack Number: " + albumTracks[i].track_number; 
				statement += "\nDuration: " + minutes + " min, " + seconds + " sec";
				statement += "\nLink:" + albumTracks[i].external_urls.spotify;
				console.log(statement);
			}
			var appendFileStatement = "\nnew spotify action;"//print to log file
			appendFileStatement += "\nuser searched: Album;";
			appendFileStatement += "\nuser specified Album: " + albumName + ";";
			appendFileStatement += "\nuser chose result \"" + selectedArtistAlbum + "\" and viewed tracks for the album;"
			var time = "\n" + moment().format().replace("T"," ") + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
			appendFileStatement += time;
			fs.appendFile("log.txt",appendFileStatement,function(err){
				doAnotherAction();
			});			
		});
	});
}

//function for searching songs on spotify
function spotifySongSearch(songName,random){
	if(songName.length > 0){//part of the required functionality in this assignment is that the user can choose to provide a song name or not provide a song name
		var searchedSong = songName;
	} else {//where the song is set if the user does not provide a song
		var searchedSong = "The Black Crow";
		var searchedArtist = "Songs: Ohia";
		var submethod = "default";
	}
	
	var songs = [];//for pushing found songs to 
	var songIDs = [];//for pushing ids of songs to - for same purpose as albums above
	spotifyAPI.clientCredentialsGrant()
	.then(function(data) {
	    // Save the access token so that it's used in future calls
	    spotifyAPI.setAccessToken(data.body['access_token']);
	    return spotifyAPI.searchTracks(searchedSong)//search for song
	}, function(err) {
	    console.log('Something went wrong when retrieving an access token', err.message);
	}).then(function(data){//for data returned from searchTracks above

		var songData = data.body.tracks.items;

		if(searchedArtist ==null || searchedArtist ==undefined){//for when the user actually specifies the song - nothing that they have done has resulted in searchedArtist being set, so this is just a way for me to identify that

			for (var i = 0 ; i < songData.length ; i++){
				songs.push("Song: " + songData[i].name + "; Artist: " + songData[i].album.artists[0].name + "; Album: " + songData[i].album.name);
				songIDs.push(songData[i].id);
			}//pushing songs and ids to arrays

			//request user to choose one of the songs from the resulting list
			inquirer.prompt([{name:"songChoice",message:"Here are the returned results for song search on \"" + searchedSong + "\". Please choose one to see more information:",choices:songs,type:"list"}]).then(function(response3){
				var selectedSongElement = songs.indexOf(response3.songChoice);//when the user has chosen the song, find element of song in songs array
				var selectedSongElementID = songIDs[selectedSongElement];//use that element index to find the appropriate song id in songIDs
				return spotifyAPI.getTrack(selectedSongElementID)//then search for track with that ID in the getTrack function
			},function(err) {
				console.log("Something went wrong when retrieving an access token",err.message);
			}).then(function(data){
				var songObj = data.body;
				spotifyToConsole_song(songObj);//print parsed data from songObj to the console - see function below
				var method = random || false;
				if(!method){//if method not provided, the user actually specified the search, so print accordingly to log.txt
					var appendFileStatement = "\nnew spotify action;"
					appendFileStatement += "\nuser searched: song;"
					appendFileStatement += "\nuser specified song: " +songName + ";"
					appendFileStatement += "\nuser viewed information on song \"" + data.body.name + "\" by \"" + data.body.album.artists[0].name + "\";";
					var time = "\n" + moment().format().replace("T"," ") + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
					appendFileStatement += time;
				} else {
					appendFileStatement = "\nspotify action accessed from random.txt;\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
				}
				fs.appendFile("log.txt",appendFileStatement,function(err){
					doAnotherAction();
				});											
			});

		} else { //when the user has not specified song, thus defaulting to The Black Crow by Songs: Ohia

			for (var i = 0 ; i < songData.length ; i++){//filtering through results to find the song by Songs:Ohia and setting the songID to be the song id for that artist's song
				if(songData[i].album.artists[0].name == searchedArtist){
					var songID = songData[i].id;
				}
			}
			searchedArtist = null;
			spotifyAPI.getTrack(songID).then(function(data){//search by songID for song using getTrack
				var songObj = data.body;
				spotifyToConsole_song(songObj);//print to console parsed data from songObj
				var appendFileStatement = "\nnew spotify action;"//print to log
				appendFileStatement += "\nuser searched: song;"
				appendFileStatement += "\nuser did not specify song;"
				var time = "\n" + moment().format().replace("T"," ") + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
				appendFileStatement += time;
				fs.appendFile("log.txt",appendFileStatement,function(err){
					doAnotherAction();
				});											
			});

		}
	});
}

//console log song data from spotify
function spotifyToConsole_song(songObj){//this was repeated multiple times so I decided to move it to its own function and only have it written once
	var statement = "**************************************************";
	statement += "\nSong name: " + songObj.name;
	statement += "\nArtist: " + songObj.album.artists[0].name;
	statement += "\nAlbum name: " + songObj.album.name;
	statement += "\nDisc Number: " + songObj.disc_number;
	statement += "\nTrack Number: " + songObj.track_number;
	var minutes = Math.floor(songObj.duration_ms/(60*1000)) % 60;//time of song is milliseconds so have to divide by 1000 -- assuming no single song is over an hour long
	var seconds = Math.floor(songObj.duration_ms/1000) % 60;
	statement += "\nDuration: " + minutes + " min, " + seconds + " sec"
	statement += "\nLink: " + songObj.external_urls.spotify;
	statement += "\n**************************************************";
	console.log(statement);
}

function OMDBer(movie,textToLog){//will contain a movie only when called in random.txt function where a movie will be parsed from random.txt

	if(movie!=null&&movie!=undefined){
		OMDBretriever(movie,textToLog);
	} else {//the main method of using OMDBer will be without having a movie name passed to the function, thus inquirer will prompt user to provide a movie
		inquirer.prompt([{name:"movie",message:"Please enter the name of the movie or the show that you would like to search for",type:"input"}]).then(function(inqResponse){
			inqResponse.movie!=""? OMDBretriever(inqResponse.movie) : OMDBretriever("The Third Man");
			//if user doesn't enter a movie name, have the default movie searched for be The Third Man
		});
	}
}

//OMDB search function
function OMDBretriever(showName,textToLog){
	var movieObj;
	request("http://www.omdbapi.com/?t=" + showName + "&y=&plot=full&r=json&apikey=40e9cece", function (error, response, body) {
		//OMDBretriever uses request function with variable showname to retrieve data
		if(error){
			console.log("Error: " + error);
		} else {
			movieObj = JSON.parse(body);//body is returned as a string, so I parse it here
			if(movieObj.Title!=undefined){//if movie was found do the following, otherwise, return that no movie was found
				var statement = "Here is information on that movie";//print to console
				statement += "\n//////////////////////////////////////////////////////";
				statement += "\nTitle of Movie: " + movieObj.Title;
				statement += "\nYear of Release: " + movieObj.Year;
				statement += "\nGenre: " + movieObj.Genre;
				if(movieObj.Type == "series"){
					statement += "\nSeasons: " + movieObj.totalSeasons;
				} else {
					statement += "\nDirector: " + movieObj.Director;
				}
				if(movieObj.Ratings!=undefined){
					if(movieObj.Ratings[0]!=undefined){
						statement += "\nIMDB Rating: " + movieObj.Ratings[0].Value;
					} else {
						statement += "\nIMDB Rating: None";
					}
					if(movieObj.Ratings[1]!=undefined){
						statement += "\nRotten Tomatoes Rating: " + movieObj.Ratings[1].Value;
					} else {
						statement += "\nRotten Tomatoes Rating: None";
					}					
				} else {
					statement += "\nNo Ratings Available"
				}
				statement += "\nCountry of Production: " + movieObj.Country;
				statement += "\nLanguage of Movie: " + movieObj.Language;
				statement += "\nPlot of Movie: " + movieObj.Plot;
				statement += "\nActors in Movie: " + movieObj.Actors;
			} else {
				var statement = "No movie in database by that name!";
			}
			console.log(statement);
			//append to log.txt
			var time = "\n" + moment().format().replace("T"," ") + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
			var appendFileStatement = "\nnew omdb action;";
			appendFileStatement += "\nmovie searched: " + movieObj.Title + ";";
			appendFileStatement += "\n" + time;
			var appendText = textToLog || appendFileStatement;//if textToLog is not null, when random function has called the omdb functions, then set appendText to textToLog - otherwise set it to the appendFIleStatement just created
			fs.appendFile("log.txt",appendText,function(err){
				doAnotherAction();
			});
		}
	});
}

//i know. kind of ridiculous to include this in a terminal app. was just very curious if i could get this to work. I want to use this for other projects
function twilioer(message){//twilio service function
	inquirer.prompt([{name:"address",message:message,type:"input"}]).then(function(response1){//address will be a phone number
		//message asks user to enter phone number
		//set it up this way so that if the user doesn't provide a valid number (which is determined below) the user will be prompted again to specify a valid phone number
		var phone = response1.address.replace(/\./g,"").replace(/\-/g,"").replace(/\(/g,"").replace(/\)/g,"");
		if( phone.length==10 && !phone.match(/[a-z]/i) ){//makes sure that the user has entered a number that contains 10 digits and that does not contain any letters
			phone="+1"+phone;//messages.create requires that the number has a "+1" on the beginning of it
			
			inquirer.prompt([{name:"message",message:"Please enter the message that you'd like to send",type:"input"}]).then(function(response2){//prompts user to enter a message
				var message = response2.message;
				
				var twiliokeys = require("./twilio_keys");
				const client = require("twilio")(twiliokeys.Acc_SID,twiliokeys.Auth_Tkn);
				client.messages.create({//creates and sends message
					from:twiliokeys.fromPhone,
					to:phone,
					body: message
				});
				//print to log file
				var time = "\n" + moment().format().replace("T"," ") + ";\n--**--**--**--**--**--**--**--**--**--**--**--**--**";
				fs.appendFile("log.txt","\nnew twilio action;",function(err){
					fs.appendFile("log.txt","\nmessage sent to " + phone + ";",function(err){
						fs.appendFile("log.txt","\nmessage: " + message + ";",function(err){
							fs.appendFile("log.txt",time,function(err){});			
						});		
					});
				});
				
				doAnotherAction();//prompts user whether they want to perform another action
			});
		} else {
		 	twilioer("The number you provided was not a valid phone number. Please enter a valid number.");
		}
	});

}