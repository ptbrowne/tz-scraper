// imports
var readline = require('readline');
var rl = readline.createInterface({
 input: process.stdin,
 output: process.stdout
});

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

var oldRlQuestion = rl.question;
rl.question = function (text) {
 var def =$.Deferred();
 oldRlQuestion.apply(rl, [text, function (answer) {
  def.resolve(answer);
 }]);
 return def.promise();
};

var clipboard = require('copy-paste')

// real meat

var getTZfromQuery = function (query) {
  var url ='http://torrentz.com/search?q=' + query.replace(' ', '+');
  return $.get(url);
};


var getTZFromTZ = function (page) {
  var links = $(page).find('a');
  // pretty fragile
  var offset = 18;
  links.slice(offset,28).each(function (i,e) {
   console.info(i, $(e).text());
  });

  return rl.question('which one? ')
   .then(function (answer) {
    var l = $(links[parseInt(answer) + offset]);
    var url = 'http://torrentz.com' + l.attr('href');
    console.log(url)
    return $.get(url);
   });
};

var getKKfromTZ = function (page) {
  var kk = $(page).find('a').filter(
    function (i,e) {
      var href = $(e).attr('href');
      return href && href.indexOf('katproxy') !== -1;
    }).attr('href');
  return $.get(kk);
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
  console.log(href);
  clipboard.copy(href, function () {
   console.log('copied!');
   process.exit();
  });
};

// main
var main = function () {
 var query = process.argv.slice(2).join(' ');
 getTZfromQuery(query)
  .then(getTZFromTZ)
  .then(getKKfromTZ)
  .then(getMagnetKK)
  .done(finish)
  .fail(function (e) { console.warn('error: ' + e.statusText); });
}

main();
