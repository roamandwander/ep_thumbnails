var api = require('ep_etherpad-lite/node/db/API');
var settings = require('ep_etherpad-lite/node/utils/Settings').ep_thumbnails || {};
var fs = require('fs');
var webshot = require('webshot');

var css = fs.readFileSync('src/static/css/pad.css').toString();
css += fs.readFileSync('src/static/custom/pad.css').toString();
css += fs.readFileSync('node_modules/ep_font_size/static/css/iframe.css').toString();

var options = {
	customCSS: (css + (settings.css || '')),
	interval: settings.interval || 30000,
	savePath: settings.savePath || './src/static/images/thumbnails/',
	windowSize: settings.windowSize || { width: 800, height: 800 },
	shotSize: settings.shotSize || { width: 800, height: 800 },
};
var padIdsToProcess = [];

exports.queueThumbnail = function (hookName, data, callback) {
	var padId = data.pad.id;
	if (padIdsToProcess.indexOf(padId) == -1) {
		padIdsToProcess.push(padId);
	}
};

exports.instantThumbnail = function (hookName, data, callback) {
	var padId = data.pad.id;
	if (padIdsToProcess.indexOf(padId) == -1) {
		padIdsToProcess.splice(padIdsToProcess.indexOf(padId), 1);
	}
	padToImage(padId);
};

setInterval(function() {
	for (var i = padIdsToProcess.length-1; i >= 0; i--) {
		padToImage(padIdsToProcess[i]);
		padIdsToProcess.splice(i, 1);
	}
}, options.interval);

function padToImage(padId) {
	api.getHTML(padId, function(error, data){
		if (data && data.html) {
			webshot(data.html, options.savePath+padId+'.png', {
				siteType: 'html',
				windowSize: options.windowSize,
				shotSize: options.shotSize,
				defaultWhiteBackground: true,
				customCSS: options.customCSS
			}, function(err, data) {
				if (err) {
					console.log(err);
				} else {
					console.log('Thumbnail saved to '+options.savePath+padId+'.png');
				}
			});
		}
	});
}