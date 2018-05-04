const URL = 'https://api.foursquare.com/v2/venues';
const INITIAL_DELAY = 500;
const SEARCH_DELAY = 2000;
const V = '20180502';
const LOCATION = 'London';


let index;
let queue;
let graphStarted = false;
let intervalID;
let timeoutID;

//initation
$(() => {
  init();
});

function init() {
  $('.config-form').submit((e) => {
    e.preventDefault();
    getResults();
  });

  $('.seed-form').submit((e) => {
    e.preventDefault();
    document.activeElement.blur();
    start();
  });

  $(window).keyup((e) => {
    // when spacebar pressed, STOP
    if (e.keyCode === 0 || e.keyCode === 32) {
      e.preventDefault();
      stop();
    }
  });
}

function getResults() {
  
  const apiKey = $('#apiKey').val().trim();
  const query = $('#fsqQuery').val().trim();

  if (apiKey === '' || query === '') {
    // Fields empty or all whitespace
    return;
  }

  $.get(`${URL}/search`, {
    near: LOCATION,
    query,
    oauth_token: apiKey,
    v: V
  })
  .done((data) => {
    // Populate select form
    const venues = data.response.venues;
    let options = '';

    for (let i = 0; i < venues.length; i++) {
      options += `<option value="${venues[i].id}">${venues[i].name}</option>`;
    }

    $('#seed').empty();
    $('#seed').append(options).removeAttr('disabled');
    $('#seed-submit').removeAttr('disabled');
  })
  .fail((err) => {
    console.log(err);
  });
}

function start() {

  $('.info').addClass('hide');
  clearInterval(intervalID);
  clearTimeout(timeoutID);
  graphStarted = false;
  reset();

  const apiKey = $('#apiKey').val();
  const venueId = $('#seed').val();
  const venueName = $('#seed option:selected').text();

  // Draw starting node
  const seedVenue = setNode(venueId, venueName, false);
  seedVenue.branch = true;
  seedVenue.fixed = true;
  seedVenue.x = graphW / 2;
  seedVenue.y = graphH / 2;
  redraw();

  timeoutID = setTimeout(() => {
    graphStarted = true;

    getSimilar(apiKey, venueId, venueName)
    .done((data) => {
      if (data.response.similarVenues.count > 0) {
        $('#stop-tip').removeClass('hide');

        intervalID = setInterval(() => {
          // Get similar venues based on a random node
          const randomIndex = Math.floor(Math.random() * queue.length);
          const randomNode = queue.splice(randomIndex, 1);

          if (randomNode[0] == null) {
            $('#error-alert').removeClass('hide');
            stop();
          }

          getSimilar(apiKey, randomNode[0]);
        }, SEARCH_DELAY);
      }
    });
  }, INITIAL_DELAY);
}

function getSimilar(apiKey, seedID, seedName) {
  return $.get(`${URL}/${seedID}/similar`, {
    oauth_token: apiKey,
    v: V
  })
  .done((data) => {
    if (!graphStarted) {
      // Stop if timer has been cleared
      return;
    }

    if (data.response.similarVenues.count === 0) {
      $('#error-alert').removeClass('hide');
      return;
    }

    const venues = data.response.similarVenues.items;
    const source = setNode(seedID, seedName, true);
    source.branch = true;

    for (let i = 0; i < venues.length; i++) {
      const target = setNode(venues[i].id, venues[i].name, true);
      links.push({
        source,
        target
      });
    }

    redraw();
  })
  .fail((err) => {
    console.log(err);
  });
}

//in case that node does not exist create one
// otherwise push in queue in order to get venues later
function setNode(id, name, add) {


  if (index[id] == null) {
    nodes.push({ id, name });

    if (add) {
      queue.push(id);
    }

    // Store index of the new node to retrieve later
    index[id] = nodes.length - 1;
  }

  return nodes[index[id]];
}

function stop() {

  if (graphStarted) {

    clearInterval(intervalID);
    clearTimeout(timeoutID);
    graphStarted = false;
    $('#stop-alert').removeClass('hide');
    $('#stop-tip').addClass('hide');
  }
}

function reset() {
  index = {};
  queue = [];
  // Reset nodes & links without reassigning them
  // as they are linked to d3
  nodes.splice(0, nodes.length);
  links.splice(0, links.length);
  redraw();
}
