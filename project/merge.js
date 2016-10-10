var fs = require('fs');
var year = "2015";

init();

function init() {
	var imdb;
	var bom;

	fs.readFile('im2015.json', 'utf-8', function(err, data) {
		if (err) {
			throw err;
		}

		imdb = JSON.parse(data).data;

		fs.readFile('bm2015.json', 'utf-8', function(err, data) {
			if (err) {
				throw err;
			}

			bom = JSON.parse(data);
			
			merge(imdb, bom.data);
		});
	});
}

function merge(imdb, bom) {
	var count = 0;
	var obj = {};
	for (var i of imdb) {
		if (bom[i.title]) {
			count++;
			var temp = {};
			temp.imdbUrl = i.url;
			temp.director = i.director;
			temp.mpaa = i.mpaa;
			temp.runtime = i.runtime;
			temp.genre = i.genre;
			temp.imdbRating = i.rating;
			temp.cast = i.cast;
			temp.gross = bom[i.title].gross;
			temp.budget = bom[i.title].budget;
			temp.openGross = bom[i.title].opnGross;
			temp.theatres = bom[i.title].theatres;
			temp.openTheatres = bom[i.title].opnTheatres;
			temp.openDate = bom[i.title].opnDate + "/" + year;
			temp.bomURL = bom[i.title].url;
			temp.metascore = i.metascore;
			obj[i.title] = temp;
		}
	}

	var json = JSON.stringify(obj);
	fs.writeFile('2015.json', json, 'utf-8', function(err) {
		if (err) {
			throw err;
		}
		console.log("file saved");
	});
	console.log(count);
}