# Living Room Racing
 Site to display sim racing results using google sheets as source.
 
 We're using a published google sheet instead of a database, accessing data via json endpoint.
 
 This is the magic line: `var url = 'https://spreadsheets.google.com/feeds/list/' + sheet + '/' + page + '/public/basic?alt=json';`

# Settings

Sample sheet:
https://docs.google.com/spreadsheets/d/1-iBCKt_2hDdBaxGiZ9UluB1or8wrOJqBEC7Q9wvpUv0/edit

First page is config page A1:A4 are config options.

A2 - race sheet count + 1 (the number of sheets to load).

A3 - date for next race

A4 - hour for the next race

If A4 and A4 are both entered  a countdown to the race will start.

There is live race-result mode, but I don't remember how to enable it at the moment.

# Setup

To config your own sheet use sample sheet format. 

File -> Publish to web. (entire document)

Set `var championshipSheetId =` to sheet id, located between /d/ and /edit...

In the sample case `1-iBCKt_2hDdBaxGiZ9UluB1or8wrOJqBEC7Q9wvpUv0`
