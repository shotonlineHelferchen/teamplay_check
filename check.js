const util = require("util");
const request = require("request");
const readlineSync = require('readline-sync');

var userName = readlineSync.question('Bitte gebe deinen Usernamen ein!\n');

let patterns = [
  userName + ",",
  userName + " ,",
  ": " + userName,
  ":" + userName,
  ", " + userName,
  "," + userName,
];

function resolve_patterns(text) {
  for (let element = 0; element <= patterns.length; element++) {
    if (text.indexOf(patterns[element]) > -1) {
      let index = text.indexOf(patterns[element]) + patterns[element].length;
      if (!(text[index] == "(" || text[index + 1] == "(")) { // überprüfen ob (ausgeschieden) oder (nicht geschafft) hinter namen steht
        return true;
      }
    }
  }
  return false;
}

async function get_thread_links() {
  let link = "http://forum.gamescampus.eu/forumdisplay.php?380-Teamplay-Forum";
  const requestPromise = util.promisify(request);
  const response = await requestPromise(link);
  let html_string = response.body.substring(response.body.indexOf("Erstellt von") + 1, response.body.length);
  let thread_links = [];
  while (html_string.includes('showthread.php?')) {
    let index = html_string.indexOf('showthread.php?');
    let temp_str = "";
    for (let i = index; i < index + 60; i++) {
      temp_str += html_string[i];
    }
    if (temp_str.indexOf("Swift") > -1) {
      thread_links.push(temp_str.substring(0, temp_str.indexOf("Swift") + 5));
    }
    else if (temp_str.indexOf("Vierer") > -1) {
      thread_links.push(temp_str.substring(0, temp_str.indexOf("Vierer") + 6));
    }
    html_string = html_string.substring(index + 1, html_string.length);
  }
  thread_links = Array.from(new Set(thread_links)); // doppelte einträge löschen
  thread_links = thread_links.sort();
  let list_teamplays = [];
  for (let i = 0; i < thread_links.length; i++) {
    let temp_arr = thread_links[i].split("-");
    list_teamplays.push({ course: temp_arr[4], type: temp_arr[5], state: "X", link: "http://forum.gamescampus.eu/" + temp_arr[0] + "/page" });
  }
  return list_teamplays;
}

async function search_for_player() {
  let list_teamplays = await get_thread_links();
  let results = [];
  for (let i = 0; i < list_teamplays.length; i++) {
    console.log("Durchsuche " + list_teamplays[i].course + " " + list_teamplays[i].type + " Thread");
    const requestPromise = util.promisify(request);
    const response = await requestPromise(list_teamplays[i].link + 1);
    let page_max = response.body[response.body.indexOf("Seite 1 von") + 12];
    for (let page_counter = 1; page_counter <= page_max; page_counter++) {
      const requestPromise = util.promisify(request);
      const response = await requestPromise(list_teamplays[i].link + page_counter);
      if (resolve_patterns(response.body)) {
        console.log("Gefunden auf Seite " + page_counter);
        list_teamplays[i].state = "O";
        break;
      }
    }
    results.push(list_teamplays[i].course+" "+list_teamplays[i].type+": "+list_teamplays[i].state);
  }
  console.log("\nO = geschafft");
  console.log("X = nicht geschafft\n");
  results.map(x => console.log(x));

}

search_for_player(); 
