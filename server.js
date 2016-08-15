var express = require('express');
var fs = require("fs");
var logger = require("morgan");
var r = require("request");
var cheerio = require("cheerio");
var app = express();

// this two lines can be uncommented if 
// you want to add any config to the request
//var config = require("./config.js");

//var request = r.defaults(config.add);
var request = r;	
app.use(logger('dev'));

app.get("/scrape", function(req, res) {	
	if (req.query.web === "mangapanda") {
		mangapandaSpider(req, res//);
	} else if (req.query.web === "readcomics") {
		readcomicsSpider(req, res//);
	}
});

function mangapandaSpider(req, res) {
	var url = "http://www.mangapanda.com/" + req.query.name + "/" + req.query.issue;

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

		var dir = "./" + req.query.name + "/" + req.query.issue;

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
	console.log(url);
	request(url, function(err, response, html) {
		if (err) {
			console.log(err);
			res.send(err);
		}

		var $ = cheerio.load(html);
		var noIssues = 0;
		
		$(".chapter-title .ct-right .label").filter(function() {
			var data = $(this);
			noIssues = data.text().match(/[0-9]+/g)[0];
		});

		console.log(noIssues);
		if(noIssues === 0) {
			res.send("not too many pages");
		}

		creatingDirectory(res, req.query.name, req.query.issue);

		var dir = "./comics/" + req.query.name + "/" + req.query.issue;

		$("#main_img").filter(function() {
			var src = this.attribs.src;
			request(src).pipe(fs.createWriteStream(dir + "/1.jpg")).on("close", function() {
				console.log("image saved");
			});

			src = src.split(/[0-9]\./)[0];
			for (var i = 2; i <= noIssues; i++) {
				request(src + i + ".jpg").pipe(fs.createWriteStream(dir + "/" + i + ".jpg")).on("close", function() {
					console.log("image saved");
				});
			}
		});
	});
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
			}
		}
	});
}

app.listen("8081");

console.log("server running on port 8081");
exports = module.exports = app;