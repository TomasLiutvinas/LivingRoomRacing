//# sourceURL=content.js

$( document ).ready(function() {
	var championshipSheetId = '1-iBCKt_2hDdBaxGiZ9UluB1or8wrOJqBEC7Q9wvpUv0';
	var recordSheetId = '1b3paiZyjWi4P1b0BNAsPnAd_CPjRtkvFnAzsqrG8WQ4';
	var pageId = 0;
	var options = {
		print: false,
		log: false
	}
	var championshipData = [];
	var liveRaceData = {
		rounds: 0,
		data: []
	};
	var recordsData = [];
	var timeRegex = /\d:\d{2}:\d{3}/g;

	var loadingProcess = [];
	var configLoad = [];

	var container = $('#content');

	var raceSheets = true;
	var sheetId = 1;

	var championshipSheetConfig = {
		sheetCount : null,
		raceDay: null
	};

	$('a[href="' + window.location.hash + '"]').click();

    $('li a.nav-link').on('click', function (e) {
        history.pushState(null, '', '/index.html#' + $(this).prop('href').split('#')[1]);
    });

	var configDef = $.Deferred();
	var configLoad = [configDef];
	getData(championshipSheetId,sheetId++, options, configDef);

	$.when.apply($, configLoad).then(function(a, b, c){
		while(sheetId != championshipSheetConfig.sheetCount && championshipSheetConfig.sheetCount){
			var deferred = $.Deferred();
			loadingProcess.push(deferred);
			//console.log(sheetId + ' : ' + championshipSheetConfig.sheetCount);
			getData(championshipSheetId,sheetId++, options, deferred);
		}

		$.when.apply($, loadingProcess).then(function(a, b, c){
			loadComplete(championshipData, liveRaceData);
		}); 
	});	

	function calculateStandings(championshipData){
		var standings = [];

		for(var raceIndex = 0; raceIndex < championshipData.length; raceIndex++){

			for(var driverIndex = 0; driverIndex < championshipData[raceIndex].drivers.length; driverIndex++){
				var driver = standings.filter(standing => (standing.Driver === championshipData[raceIndex].drivers[driverIndex].driverName));
				var points = getPoints(driverIndex);
				var missedRace = championshipData[raceIndex].drivers[driverIndex].trackTime == 'DNS';
				var skippedRace = championshipData[raceIndex].drivers[driverIndex].trackTime == 'DNF';
				(skippedRace || missedRace) ? (points = 0):skippedRace;

				if(driver && driver.length > 0){
					missedRace ? driver[0].Missed++ : missedRace;
					!missedRace ? driver[0].Points += points : missedRace;
				}else{
					standings.push(
						{
							Driver: championshipData[raceIndex].drivers[driverIndex].driverName, 
							Points: points,
							Missed: missedRace ? 1 : 0
						});
				}	
			}
		}

		standings = standings.sort(function (a, b) {
			return b.Points - a.Points;
		});

		return standings;
	};

	function drawTimer(container){
		container.append('<div class="timerContainer">\
						  	<p class="track"><b>Next race in:</b></p>\
						  	<p id="timer" class="timer"></p>\
						  </div>');

		var x = setInterval(function() {
			var now = new Date().getTime();

			if(!championshipData.raceDay){
				clearInterval(x);
				document.getElementById("timer").innerHTML = "TBD";
			}else{
				var distance = championshipData.raceDay - now;

				if(distance > 0){
					var days = Math.floor(distance / (1000 * 60 * 60 * 24));
				    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
				    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
				    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

				    document.getElementById("timer").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";
				}else{
					clearInterval(x);
					document.getElementById("timer").innerHTML = "Race is LIVE!";
				}	
			}
		}, 1000);
	};

	function drawLiveRace(container, liveData){

		var liveDataString = '<p class="track"><b>LIVE RACE TIMES</b></p>';
			liveDataString += '<table style="width:600px">';
			liveDataString += '<tr>';
			liveDataString += '<th>Driver</th>';

			for(var roundIndex = 0; roundIndex < liveData.rounds; roundIndex++){
				liveDataString += '<th>R' + Number(roundIndex+1) + '</div></th>';
			}
			liveDataString += '</tr>';

			for(var driverIndex = 0; driverIndex < liveData.data.length; driverIndex++){
				liveDataString += '<tr>';
				liveDataString += '<td>' + liveData.data[driverIndex].driverName + '</td>';
				var dns = false;
				var leftTheRace = false;
				//<span class="up"/>
				//<span class="down"/>

				for(var roundIndex = 0; roundIndex < liveData.rounds; roundIndex++){
					if(dns){
						liveDataString += '<td></td>';
					}else{
						if(leftTheRace){
							liveDataString += '<td></td>';
						} else {
							if(liveData.data[driverIndex].roundTimes[roundIndex] == 'dns'){
								dns = true;
								liveDataString += '<td>DNS</td>';
							}else if(!liveData.data[driverIndex].roundTimes[roundIndex]){
								liveDataString += '<td class="pending-dot"><span class="dot"/></td>';
							}else if(liveData.data[driverIndex].roundTimes[roundIndex] == 'left'){
								leftTheRace = true;
								liveDataString += '<td>DNF</td>';
							} else {
								if(liveData.data[driverIndex].roundTimes[roundIndex] != '-'){
									roundTime = liveData.data[driverIndex].roundTimes[roundIndex];
									if(roundIndex != 0){
										liveDataString += '<td>' + roundTime + '<span class="up"/></td>';
									}else{
										liveDataString += '<td>' + roundTime + '</td>';
									}
								}else{
									liveDataString += '<td>' + roundTime + '</td>';
								}
							}
						}
					}
				}
				liveDataString += '</tr>';
			}

			liveDataString += '</table>';

			container.append(liveDataString);
	};

	function getMsFromString(time){
		var parts = time.split(':');
		return (parts[0]*1000*60 + parts[1]*1000 + parts[2]);
	};

	function drawStandings(container, standings){
		var raceString = '<p class="track"><b>Championship Standings</b></p>';

			raceString += '<table style="width:600px">';
			raceString += '<tr>';
			raceString += '<th>Driver</th>';
			raceString += '<th>Points</th>';
			raceString += '<th>Difference</th>';
			raceString += '<th>Tracks Missed</th>';
			raceString += '</tr>';

			for(var driver = 0; driver < standings.length; driver++){
				raceString += '<tr>';
					raceString += '<td>' + standings[driver].Driver + '</td>';
					raceString += '<td>' + standings[driver].Points + '</td>';
					var difference = driver ? standings[driver-1].Points - standings[driver].Points : 'Lead';
					raceString += '<td>' + difference + '</td>';
					raceString += '<td>' + standings[driver].Missed + '</td>';
				raceString += '</tr>';
			}

			raceString += '</table>';

			container.append(raceString);
	};

	function loadComplete(championshipData, liveRaceData){

		championshipData = championshipData.sort(function (a, b) {
		    return b.trackNo - a.trackNo;
		});

		var standings = calculateStandings(championshipData);
		drawTimer(container);
		if(liveRaceData && liveRaceData.data && liveRaceData.data.length > 0){
			drawLiveRace(container,liveRaceData);	
		}
		drawStandings(container, standings);

		for(var race = 0;race < championshipData.length;race++){

			var raceString = '<p class="track"><b>' + championshipData[race].track + '</b></p>';

			raceString += '<table style="width:600px">';
			raceString += '<tr>';
			raceString += '<th>Driver</th>';
			raceString += '<th>Time</th>';
			raceString += '<th>Next Driver Difference</th>';
			raceString += '<th>Pole Difference</th>';
			raceString += '<th>Points</th>';
			raceString += '</tr>';

			for(var driver = 0; driver < championshipData[race].drivers.length; driver++){
				raceString += '<tr>';
					raceString += '<td>' + championshipData[race].drivers[driver].driverName + '</td>';
					raceString += '<td>' + championshipData[race].drivers[driver].trackTime + '</td>';
					var next = driver ? getDifference(championshipData[race].drivers[driver-1].trackTime, championshipData[race].drivers[driver].trackTime) : 'Interval';
					raceString += '<td>'+ next +'</td>';
					var interval = driver ? getDifference(championshipData[race].drivers[0].trackTime, championshipData[race].drivers[driver].trackTime) : 'Interval';
					raceString += '<td>'+ interval +'</td>';
					if(championshipData[race].drivers[driver].trackTime == 'DNF'){
						raceString += '<td>0</td>';
					}else if(championshipData[race].drivers[driver].trackTime == 'DNS'){
						raceString += '<td>?</td>';
					} else {
						raceString += '<td>'+ getPoints(driver) +'</td>';
					}
					
				raceString += '</tr>';
			}

			raceString += '</table>';

			container.append(raceString);
		}
	};

	function getDifference(firstTime, secondTime){
		var first = firstTime.split(':');
		var second = secondTime.split(':');

		if(first.length > 1 && second.length > 1){

			firstMillis = Number(first[0]) * 60000 + Number(first[1]) * 1000 + Number(first[2]);
			secondMillis = Number(second[0]) * 60000 + Number(second[1]) * 1000 + Number(second[2]);

			var differenceMillis = secondMillis - firstMillis;

			var diffSeconds = differenceMillis / 1000;
			var diffMillis = differenceMillis % 1000;

			return diffSeconds + 's';
		}else if(secondTime == 'DNF'){
			return 'DNF';
		}else{
			return 'DNS'
		}
	};

	function getPoints(position){
		switch(position){
			case 0:
				return 25;
			case 1:
				return 18;
			case 2:
				return 15;
			case 3:
				return 12;
			case 4:
				return 10;
			case 5:
				return 8;
			case 6:
				return 6;
			case 7:
				return 4;
			case 8:
				return 2;
			case 9:
				return 1;
			default:
				return 0;

		}
	};

	function getData(sheet, page, options, deferred){
		var url = 'https://spreadsheets.google.com/feeds/list/' + sheet + '/' + page + '/public/basic?alt=json';
		$.ajax({
		    url: url,
		    type: 'GET',
		    headers: {},
		    contentType: "application/json; charset=utf-8",
		    dataType: 'jsonp',
		    success: function (data) {
		    	var sheetTitle = data.feed.title.$t;
		    	switch(true){
		    		case (sheetTitle.toLowerCase().indexOf('config') > -1):
		    			championshipSheetConfig.sheetCount = Number(data.feed.entry[0].title.$t);
		    			if(data.feed.entry[1].title.$t.toLowerCase().indexOf("row") == -1 && data.feed.entry[2].title.$t.toLowerCase().indexOf("row") == -1){
		    				championshipData.raceDay = new Date(data.feed.entry[1].title.$t + ' ' + data.feed.entry[2].title.$t);	
		    			}
		    			break;
		    		case (sheetTitle.toLowerCase().indexOf(' gp') != -1) && sheetTitle.toLowerCase().indexOf(' live') == -1:
			    		if(options.print){
				    		container.append('<p><b>' + sheetTitle + '</b></p>');	
				    	}
				    	
				    	var drivers = [];

				    	for(var driverId = 0; driverId < data.feed.entry.length; driverId++){
				    		var driverName = data.feed.entry[driverId].title.$t;
			    			var trackTime;
			    			if(data.feed.entry[driverId].content.$t.indexOf('DNF') != -1){
			    				trackTime = 'DNF';
			    			}else{
			    				trackTime = data.feed.entry[driverId].content.$t.match(timeRegex) ? data.feed.entry[driverId].content.$t.match(timeRegex)[0] : 'DNS';
			    			}

				    		var driver = {
				    			driverName: driverName,
				    			trackTime: trackTime
				    		};
				    		drivers.push(driver);

				    		if(options.log){
				    			console.log(driver.name + ' : ', driver.trackTime);	
				    		}
				    	}

				    	drivers = drivers.sort(function (a, b) {
						    return b.trackTime - a.trackTime;
						});

				    	if(options.print){
				    		for(var d = 0; d < drivers.length;d++){
					    		container.append('<p>' + drivers[d].name + ' : ' + drivers[d].trackTime + '</p>');
					    	}
				    	}
		    			championshipData.push({ track: sheetTitle, drivers: drivers, trackNo: page });
		    			break;
	    			case sheetTitle.toLowerCase().indexOf(' live') > -1:
	    				var rounds = 0;

	    				for(var entryIndex = 0; entryIndex < data.feed.entry.length; entryIndex++){

	    					var times = data.feed.entry[entryIndex].content.$t;
		    				times = times.split(',');
		    				for(var i = 0; i < times.length; i++){
		    					times[i] = times[i].split(': ')[1];
		    				}
		    				rounds = (times.length > rounds) ? times.length : rounds;

		    				var driver = data.feed.entry[entryIndex].title.$t;
		    				liveRaceData.data.push({ driverName: driver, roundTimes:times });
	    				}

	    				liveRaceData.rounds = rounds;
	    				break;
    				default:
    					//console.log('false');
    					break;
		    	}
		    	deferred.resolve();
		    },
		    error: function (qXHR, textStatus, errorThrown) {
		    	console.log('broked');
		    	raceSheets = false;
		    }
		});
	}
});