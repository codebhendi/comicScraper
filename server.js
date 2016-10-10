var express = require('express');
var fs = require("fs");
var logger = require("morgan");
var r = require("request");
var cheerio = require("cheerio");
var app = express();
var t = require("html");

// this two lines can be uncommented if 
// you want to add any config to the request
// var config = require("./config.js");

// var request = r.defaults(config.add);
var request = r;	
app.use(logger('dev'));

app.get("/scrape", function(req, res) {

	if (req.query.web === "mangapanda") {
		mangapandaSpider(req, res);
	} else if (req.query.web === "readcomics") {
		readcomicsSpider(req, res);
	} else if (req.query.web.match(/[a-z]+\.hentai/g)) {
		mangaHentai(req, res);
	}
});

app.get("/ftp", function(req, res) {
	var url = "ftp://myftp.iiita.ac.in/Study/Stanford%20Classes/db-class/"
	request(url, function(err, response, html) {
		var $ = cheerio.load(html);
		var dir = "./db";

		fs.mkdir(dir, 0777, function(err) {
			if (err && err.code != "EEXIST") {
				console.log(err);
				res.send(err);
			}	
		});

		$("a").each(function() {
			var src = this.attribs.href;
			console.log(url + "/" + src);
			request(url + "/" + src).pipe(fs.createWriteStream(dir + "/" + src))
				.on("close", function() {
					console.log("saved" + src);
				})
				.on("end", function() {
					console.log("saved");
				})
				.on("error", function() {
					console.log("shit happens");
				});
		});

		res.send("done");
	});
});

function mangaHentai(req, res) {
	var url = "http://" + req.query.web + ".ms/manga/" + req.query.name;

	request(url, function(err, response, html) {
		if (err && response.statusCode !== 200) {
			console.log(err);
			throw err;
		}

		var $ = cheerio.load(html);
		
		var title = $(".index_box h2 a").last().text();

		console.log(title);
		title = title.replace(/ /g, '_');
		creatingDirectory(res, title, 0);

		var temp = $('.search_gallery a').first().attr('href');

		scrapeHentai(res, temp, 0, "comics/" + title + "/0");
	});
}

function scrapeHentai(res, url, index, dir) {
	request(url, function(err, response, html) {
		if (err) {
			throw err;
		}

		var $ = cheerio.load(html);

		var next = $('.index_box table center a').last();
		next = next.attr('href');

		var image = $('.index_box table center a img').first();
		image  = image.attr('src');

		request(image).pipe(fs.createWriteStream(dir + "/"+ index + ".jpg")).on("close", function() {
			console.log("image" + index + " done");
			
			if(next.search('search.hentai') !== -1) {
				console.log('done');
				res.send('done');
			} else if (url.search('/done') !== -1) {
				console.log('done');
				res.send('done')
			} else {
				scrapeHentai(res, next, index + 1, dir);
			}
		});
	});
}

function mangapandaSpider(req, res) {
	var url = "http://www.mangapanda.com/" + req.query.name + "/" + req.query.issue;
	console.log(url);
	request(url, function(error, response, html) {
		if (error) {
			console.log(error);
			res.send(error);
		}

		var noIssues = 0;
		var $ = cheerio.load(html);
		
		$('#selectpage').filter(function() {
			var data = $(this);
			noIssues = data.children().first().children().length;
		});

		if (noIssues === 0) {
			res.send("not too many pages");
		}

		creatingDirectory(res, req.query.name, req.query.issue);

		var dir = "./comics/" + req.query.name + "/" + req.query.issue;

		$("#img").filter(function() {
			var src = this.attribs.src;

			request(src).pipe(fs.createWriteStream(dir + "/1.jpg")).on("close", function() {
				console.log("image saved");
			});
		});

		for (var i = 2; i <= noIssues; i++) {
			extract(url + "/" + i, dir + "/" + i + ".jpg" , i);
		}

		res.send("check your console");
	});
}

function readcomicsSpider(req, res) {
	var url = "http://www.readcomics.tv/" + req.query.name + "/chapter-" + req.query.issue;
	
	request(url, function(err, response, html) {
		if (err) {
			console.log(err);
			res.send(err);
		}

		var $ = cheerio.load(html);
		var noIssues = 0;

		creatingDirectory(res, req.query.name, req.query.issue);

		var dir = "./comics/" + req.query.name + "/" + req.query.issue;
		console.log($("#main_img").html());
		$("#main_img").each(function() {
			console.log(this);
			var src = this.attribs.src;

			request(src).pipe(fs.createWriteStream(dir + "/1.jpg")).on("close", function() {
				console.log("image saved");
			});

			readcomicsCrawl(this.parent.attribs.href, dir, res, 2, function() {
				res.send("done");
			});
			//res.send("done");

			return ;
		});
		res.send("error");
		//console.log("shit happens");
	});
}

function readcomicsCrawl(url, dir, res, index, cb) {
	if (url.match(/http\:\/\/www.readcomics.tv\/[a-z0-9A-Z\-]+\/chapter\-[0-9]+\/[0-9]+/g) === null) {
		cb();
		return;
	}

	request(url, function(err, res, html) {
		if (err) {
			res.send(err);
			return ;
		}

		var $ = cheerio.load(html);

		$("#main_img").filter(function() {
			var src = this.attribs.src;
			request(src).pipe(fs.createWriteStream(dir + "/" + index + ".jpg")).on("close", function() {
				console.log("image saved" + index);
			});

			readcomicsCrawl(this.parent.attribs.href, dir, res, index + 1, cb);
		});
	});

	return ;
}

function extract(url, path) {
	request(url, function(err, response, html) {
		if (err) {
			return err;
		}

		var $ = cheerio.load(html);

		$("#img").filter(function() {
			var src = this.attribs.src;
			request(src).pipe(fs.createWriteStream(path));
		});
	});
}

function creatingDirectory(res, name, issue) {
	var dire = "./comics";
	fs.mkdir(dire, 0777, function(err) {
		if (err) {
			if (err.code !== "EEXIST") {
				console.log(err);
				res.send(err);
			}
		}
	})

	dire += "/" + name;
	
	fs.mkdir(dire, 0777, function(err) {
		if (err){
			if (err.code != "EEXIST") {
				console.log(err);
				res.send(err);
			}				
		}
	});

	dire += "/" + issue;

	fs.mkdir(dire, 0777, function(err) {
		if (err) {
			if (err.code != "EEXIST") {
				console.log(err);
				res.send(err);
			} else {
				throw "file already der";
				res.send('done');
			}
		}
	});
}

app.listen("8081");

console.log("server running on port 8081");
exports = module.exports = app;
