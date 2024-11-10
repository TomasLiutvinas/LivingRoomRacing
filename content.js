$(document).ready(function() {
  var container = $('#content');
  var lapRecordsData = [];

  // Load JSON data from lapTimes.json
  loadJSONData();

  function loadJSONData() {
    fetch('lapTimes.json')
      .then(response => response.json())
      .then(data => {
        lapRecordsData = data.lapRecords;
        drawStandings(container, lapRecordsData);
        renderLapRecords(lapRecordsData);
      })
      .catch(error => console.error('Error loading JSON data:', error));
  }

  function renderLapRecords(lapRecordsData) {
    const racesByYear = lapRecordsData.reduce((acc, race) => {
      if (!acc[race.year]) acc[race.year] = [];
      acc[race.year].push(race);
      return acc;
    }, {});

    Object.keys(racesByYear).sort((a, b) => b - a).forEach(year => {
      container.append(`<p class="track"><b>${year} Racing Season</b></p>`);

      racesByYear[year].forEach(race => {
        let raceString = `<p class="track"><b>${race.race}</b></p>`;
        raceString += '<table style="width:600px"><tr><th>Driver</th><th>Time</th><th>Penalty</th><th>Next Driver Difference</th><th>Pole Difference</th><th>Points</th></tr>';

        const drivers = race.records.map(driver => {
          const adjustedTime = applyPenalty(driver.lapTime, driver.penalty);
          return { ...driver, adjustedTime };
        }).sort((a, b) => getMsFromString(a.adjustedTime) - getMsFromString(b.adjustedTime));

        drivers.forEach((driver, index) => {
          const adjustedTime = driver.adjustedTime;
          const penalty = driver.penalty || "None";
          const points = getPoints(index);

          const nextDiff = index === 0 ? 'Interval' : getDifference(drivers[index - 1].adjustedTime, adjustedTime);
          const poleDiff = index === 0 ? 'Pole' : getDifference(adjustedTime, drivers[0].adjustedTime);

          raceString += `<tr>
<td>${driver.driverName}</td>
<td>${adjustedTime}</td>
<td>${penalty}</td>
<td>${nextDiff}</td>
<td>${poleDiff}</td>
<td>${points}</td>
</tr>`;
        });

        raceString += '</table>';
        container.append(raceString);
      });
    });
    }

  function applyPenalty(lapTime, penalty) {
    if (!penalty) return lapTime; // No penalty applied
    const penaltySeconds = parseInt(penalty.match(/\d+/)) || 0;
    const originalMillis = getMsFromString(lapTime);
    const adjustedMillis = originalMillis + penaltySeconds * 1000;
    return msToLapTimeString(adjustedMillis);
  }

  function getMsFromString(time) {
    const [minutes, seconds, milliseconds] = time.split(':').map(Number);
    return (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
  }

  function getDifference(fasterTime, slowerTime) {
    const fasterMillis = getMsFromString(fasterTime);
    const slowerMillis = getMsFromString(slowerTime);
    const differenceMillis = Math.abs(slowerMillis - fasterMillis);
    return msToLapTimeString(differenceMillis);
  }

  function msToLapTimeString(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const millis = milliseconds % 1000;
    return `${minutes}:${String(seconds).padStart(2, '0')}:${String(millis).padStart(3, '0')}`;
  }

  function drawStandings(container, lapRecordsData) {
    const standingsByYear = {};

    // Aggregate data by year and driver
    lapRecordsData.forEach(race => {
      const year = race.year;
      if (!standingsByYear[year]) standingsByYear[year] = {};

      race.records.forEach((record, index) => {
        const driverName = record.driverName;
        if (!standingsByYear[year][driverName]) {
          standingsByYear[year][driverName] = { Points: 0, Missed: 0 };
        }

        // Calculate points based on position
        standingsByYear[year][driverName].Points += getPoints(index);

        // Count missed races (DNS or absent driver record)
        if (record.lapTime === "DNS") {
          standingsByYear[year][driverName].Missed += 1;
        }
      });
    });

    // Render standings for each year
    Object.keys(standingsByYear).sort((a, b) => b - a).forEach(year => {
      let raceString = `<p class="track"><b>${year} Championship Standings</b></p>`;
      raceString += '<table style="width:600px">';
      raceString += '<tr><th>Driver</th><th>Points</th><th>Difference</th><th>Tracks Missed</th></tr>';

      const standings = Object.entries(standingsByYear[year])
      .map(([driver, stats]) => ({ Driver: driver, ...stats }))
      .sort((a, b) => b.Points - a.Points);

      standings.forEach((driver, index) => {
        raceString += `<tr>
<td>${driver.Driver}</td>
<td>${driver.Points}</td>
<td>${index === 0 ? 'Lead' : standings[index - 1].Points - driver.Points}</td>
<td>${driver.Missed}</td>
</tr>`;
      });

      raceString += '</table>';
      container.append(raceString);
    });
  }

  function getPoints(position) {
    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    return pointsTable[position] || 0;
  }
});
