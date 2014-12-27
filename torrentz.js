// imports
var readline = require('readline');
var colour = require('colour');
var exec = require('child_process').exec;

var pad = require('pad');
var cheerio = require('cheerio');
var jsdom = require("jsdom").jsdom;
var markup = '<html><body><h1 class="example">Hello World!</h1><p class="hello">Heya Big World!</body></html>';
var doc = jsdom(markup);
var window = doc.parentWindow;
var $ = require('jquery')(window);
var jQuery = $;
var inquirer = require('inquirer');

XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
$.support.cors = true;
$.ajaxSettings.xhr = function() {
    return new XMLHttpRequest();
};
var httpGet = $.get;

// helper
var setLoadingText = function (data) {
  console.info("opening...");
  return data;
};

// real meat
var getTZfromQuery = function (query) {
  var url ='http://torrentz.com/search?q=' + query.replace(' ', '+');
  return httpGet(url);
};

var mkChoiceFromRow = function (row) {
  console.log('mkChoiceFromRow')
  var s = pad(7, row.find('.s').text());
  var u = pad(4, row.find('.u').text());
  var d = pad(4, row.find('.u').text(), 4);
  var r = pad(4, (u/d*100).toFixed(2) + '%');
  var name = pad(row.find('a').text().slice(0,80), 80);
  return [name, s.blue, u.red, d.green, r].join(' ');
};

var getTZFromTZ = function (page) {
  console.log('getTZFromTZ');
  var $ = cheerio.load(page);
  var rows = $('.results dl');
  // pretty fragile
  var choices = rows.slice(0,5).map(function (i,e) {
    var row = $(e);
    return {
      value: i,
      name: mkChoiceFromRow(row)
    };
  }).toArray();

  var def = jQuery.Deferred();
  inquirer.prompt([{
    type: 'list',
    choices: choices,
    message: 'which one ?',
    name: 'torrent'
  }], function (answers) {
    def.resolve(answers.torrent);
  });
  return def.promise()
   .then(setLoadingText)
   .then(function (answer) {
    var l = $(rows[parseInt(answer)]).find('a');
    var url = 'http://torrentz.com' + l.attr('href');
    return httpGet(url);
   });
};

var getKKfromTZ = function (page) {
  console.log('getKKfromTZ');
  var $ = cheerio.load(page);
  var kk = $('a').filter(
    function (i,e) {
      var href = $(e).attr('href');
      return href && href.indexOf('katproxy') !== -1;
    }).attr('href');
  return httpGet(kk);
};

var getMagnetKK = function (page) {
  console.log('getMagnetKK');
  var buttonLineLinks = $(page).find('.buttonsline a');
  var magnet = $(page).find('.buttonsline a').filter(function (i, e) {
    var href = $(e).attr('href');
    return href && href.indexOf('magnet') !== -1;
  }).attr('href');
  return magnet;
};

var finish = function (href) {
  console.info('enjoy !'.rainbow);
  exec('open ' + href);
  process.exit();
};

// main
console.log = function () {};
var main = function () {
 var query = process.argv.slice(2).join(' ');
 console.log('searching...');
 getTZfromQuery(query)
  .then(getTZFromTZ)
  .then(getKKfromTZ)
  .then(getMagnetKK)
  .done(finish)
  .fail(function (e) { console.warn('error: ' + e.statusText); });
}

main();
