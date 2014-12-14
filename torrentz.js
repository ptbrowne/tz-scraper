// imports
var readline = require('readline');
var colour = require('colour');
var exec = require('child_process').exec;
var rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout
});
var pad = require('pad');
var cheerio = require('cheerio');
var jsdom = require("jsdom").jsdom;
var markup = '<html><body><h1 class="example">Hello World!</h1><p class="hello">Heya Big World!</body></html>';
var doc = jsdom(markup);
var window = doc.parentWindow;
var $ = require('jquery')(window)
XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
$.support.cors = true;
$.ajaxSettings.xhr = function() {
    return new XMLHttpRequest();
};
var httpGet = $.get;

var oldRlQuestion = rl.question;
rl.question = function (text) {
 var def =$.Deferred();
 oldRlQuestion.apply(rl, [text, function (answer) {
  def.resolve(answer);
 }]);
 return def.promise();
};

// helper
var setLoadingText = function (data) {
  console.log("opening...");
  return data;
};

// real meat

var getTZfromQuery = function (query) {
  var url ='http://torrentz.com/search?q=' + query.replace(' ', '+');
  return httpGet(url);
};

var getTZFromTZ = function (page) {
  var $ = cheerio.load(page);
  var rows = $('.results dl');
  // pretty fragile
  rows.slice(0,10).each(function (i,e) {
    var row = $(e);
    var n = pad(('' + i));
    var s = pad(7, row.find('.s').text());
    var u = pad(4, row.find('.u').text());
    var d = pad(4, row.find('.u').text(), 4);
    var r = pad(4, (u/d*100).toFixed(2) + '%');
    var name = pad(row.find('a').text(), 80);
   console.info([n.yellow, name, s.blue, u.red, d.green, r].join(' '));
  });

  return rl.question('which one? ')
   .then(setLoadingText)
   .then(function (answer) {
    var l = $(rows[parseInt(answer)]).find('a');
    var url = 'http://torrentz.com' + l.attr('href');
    return httpGet(url);
   });
};

var getKKfromTZ = function (page) {
  var kk = $(page).find('a').filter(
    function (i,e) {
      var href = $(e).attr('href');
      return href && href.indexOf('katproxy') !== -1;
    }).attr('href');
  return httpGet(kk);
};

var getMagnetKK = function (page) {
  var buttonLineLinks = $(page).find('.buttonsline a');
  var magnet = $(page).find('.buttonsline a').filter(function (i, e) {
    var href = $(e).attr('href');
    return href && href.indexOf('magnet') !== -1;
  }).attr('href');
  return magnet;
};

var finish = function (href) {
  console.log('enjoy'.rainbow);
  exec('open ' + href);
  process.exit();
};

// main
var main = function () {
 var query = process.argv.slice(2).join(' ');
 console.log('searching...')
 getTZfromQuery(query)
  .then(getTZFromTZ)
  .then(getKKfromTZ)
  .then(getMagnetKK)
  .done(finish)
  .fail(function (e) { console.warn('error: ' + e.statusText); });
}

main();
