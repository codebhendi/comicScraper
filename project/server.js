// 	All these reuqiremenets
// 	can be installed by typing
// 	npm install
// 	then to run the fiel just type
// 	node server.js
var fs = require("fs");
var r = require("request");
var cheerio = require("cheerio");
var t = require("html");

// 	Put your id and password for
// 	proxy server here
var request = r.defaults({'proxy': "http://iit2013172:Tr1albycombat@172.31.1.4:8080"});

// 	Initial function call
init();

// 	Object to save our data
var obj = {
	data : []
};
var t = 2012;

var count;

function init() {
	// 	Initial or seed url to start the scraping process
	// 	after that we will crawl through all thr urls
	// 	you cam add the other years url
	// 	to scrape other year's data
	var url1 = "http://www.imdb.com/search/title?year=" + t +"," + t + "&title_type=feature&sort=moviemeter,asc";

	// var url2 = "http://www.boxofficemojo.com/yearly/chart/?page=1&view=releasedate&view2=domestic&yr=2011&p=.htm";
	
	// for (var i = 2001; i <= 2001; i++)
	// 	scrapeBoxOfficeMojo("http://www.boxofficemojo.com/yearly/chart/?page=1&view=releasedate&view2=domestic&yr=" + i + "&p=.htm", i);
	// prep(url1);

	scrape(url1);
};


function prep(url) {
	fs.readFile('data.json', 'utf-8', function(err, data) {
		var data = JSON.parse(data);
		scrapetemp(url, data, 0);
	});
}

function scrapetemp(url, data, index) {
	request(url, function(err, response, html) {
		if (err) {
			throw err;
		}

		var $ = cheerio.load(html);

		$('.metascore').each(function() {
			var el = $(this);
			console.log(data.data[index].title)
			data.data[index].metascore = $(this).text();
			index++;
		});

		var next = $('.next-page').first().attr('href');

		if (next) {
			next = "http://www.imdb.com/search/title" + next;
		} else {
			return ;
		}

		var json = JSON.stringify(data);

		fs.writeFile('im2015.json', json, 'utf-8', function(err) {
			if (err) {
				throw err;
			}

			console.log("file saved");
		});

		scrapetemp(next, data, index)

	});
}

// The main scraping funtion
// you have to provide the scraping url for imdb movies per year website
// and it will handle it all
function scrape(url) {
	console.log(url);
	// 	Request method requests the page from the world wide
	// 	web to be scraped by us.
	// 	We use cheerio.js to load the web page in form of DOM
	// 	which can then be manipulated in jquery type
	// 	structure
	request(url, function(err, response, html) {
		if (err) {
			console.log(err);
			return ;
		}

		var $ = cheerio.load(html);
		// 	Selecting the main containe for each section
		// 	on a single page
		$('.lister-item-content').each(function() {
			var data = $(this);
			var object = {};
			object.title = data.find('a').first().text();
			object.url = "http://www.imdb.com" + data.find('a').first().attr('href');
			object.mpaa = data.find('.certificate').first().text();
			object.runtime = data.find('.runtime').first().text();
			
			var str = data.find('.genre').first().text();
			str = str.substr(1, str.length - 1);
			str = str.replace(/\s/g, '');
			object.genre = str;
			
			object.rating = data.find('.ratings-imdb-rating').first().attr('data-value');
			object.cast = [];

			var temp = data.find('.ratings-bar').next().next();

			temp.find('a').each(function(i, elem) {
				if (i == 0) {
					object.director = $(this).text();
				} else {
					object.cast.push($(this).text());
				}
			});

			object.gross = data.find('.sort-num_votes-visible span').last().attr('data-value');
			object.metascore = data.find('.metascore').first().text().split(' ')[0];
			//console.log();
			obj.data.push(object);
		});
		// 	After all data is extracted 
		// 	extracting the next page url
		url = $('.next-page').first().attr('href');
		console.log(obj);
		save();

		// 	Call for the next page url
		// 	and also safetey measure to end sraping
		// 	when we reach the final page
		if (url !== undefined) {
			scrape("http://www.imdb.com/search/title"  + url);
		}
	});
}

function scrapeBoxOfficeMojo(url, year) {
	request(url, function(err, response, html) {
		if (err) {
			console.log(err);
			return ;
		}

		var $ = cheerio.load(html);

		var b = $('table tr center font font').first();

		var next = b.next().attr('href');

		if (next !== undefined) {
			next = "http://www.boxofficemojo.com" + next;
			console.log(next);
		}

		var a = b.text().split(/[#–]/g);
		count  = parseInt(a[2]) - parseInt(a[1]);

		var arr = $('table tr table tr table tr');

		for (var i = 3; i < arr.length; i++) {
			var data = $(arr[i]);

			var el = data.find('td');
			if (el.length < 9) {
				continue;
			}

			var object = {};

			object.gross = $(el[3]).text().toString();
			object.theatres = $(el[4]).text().toString();
			object.opnGross = $(el[5]).text().toString();
			object.opnTheatres = $(el[6]).text().toString();
			object.opnDate = $(el[7]).text().toString();

			if ($(el[1]).find('a').first().attr('href') !== undefined) {
				object.url = "http://www.boxofficemojo.com/" + $(el[1]).find('a').first().attr('href').toString();
			} else {
				continue;
			}
			
			getBudget(object, el[1], next, year);
		}
	});
}

function getBudget(object, el, next, year) {
	request(object.url, function(err, response, html) {
		$ = cheerio.load(html);

		var data = $('table tr table tr table tr center table tr td b').last();
		
		object.budget = $(data).text().toString();
		obj.data[$(el).text().toString()] = object;
		count--;
		
		if (count === 0) {
			savebom(year);

			if (next !== undefined) {
				scrapeBoxOfficeMojo(next, year);
			}
		}
	})
}

// 	Save function to save all the data to
// 	the data.json file.
// 	You can change the name of the file
// 	and also the location.
function savebom(year) {
	var json = JSON.stringify(obj);
	fs.writeFile("bm" + year +".json", json, 'utf-8', function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("file saved");
		}
	});
}

function save() {
	var json = JSON.stringify(obj);
	fs.writeFile("im" + t +".json", json, 'utf-8', function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("file saved");
		}
	});
}