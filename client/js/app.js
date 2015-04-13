var main = function () {
	"use strict";

	$("#popular").hide();

	$("#submit").click( function () {
		var url = $("#url").val();
		var req = {url: url};

		if (url.indexOf("localhost:3000") > -1) {
			$.getJSON("url/" + url.substr(-4), function (res) {	
				var $fullURL = $("<a>").attr("href", res.url).text(res.url);
				$("#result").text("The full URL is: ").append($fullURL);
			});
		}
		else {
			$.post("shorten", req, function (res) {				
			var $shortURL = $("<a>").attr("href", res.key).text("localhost:3000/" + res.key);
			$("#result").text("Your short URL is: ").append($shortURL);	
			});
		}
	});

	$.getJSON("top/get", function (res) {
		var top = res.top10;

		if (typeof top !== "undefined") {

			$("#popular").fadeIn();

		top.forEach( function (url) {
			var $tr = $("<tr>").hide(),
				$a = $("<a>").attr("href", "localhost:3000/" + url.key).text(url.key);

			$tr.append( $("<td>").text(url.hits) );
			$tr.append( $("<td>").append($a) );
			$("#top-table").append($tr);
			$tr.fadeIn();
		});
		}
	});
};

$(document).ready(main);