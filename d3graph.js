

/*
"Modifying a Force Layout" by Mike Bostock from:
 https://bl.ocks.org/mbostock/1095795 used widely.
*/

const links = [];
const graphW = 1000;
const graphH = 540;
const nodes = [];


//create a force layout object and define it's properties
//charge - prevent nodes from ending up "on top of each other"
const force = d3.layout.force()

   .charge((d) => {
       //Branch nodes have more charge to spread
      // children out more evenly
      let charge = -100;
      if (d.branch) { charge *= 10; }
      return charge;
    })
    .friction(0.75)
    .nodes(nodes)
    .links(links)
    .size([graphW, graphH])
    .linkDistance(60)
    .on('tick', tick);

const svg = d3.select('#d3graph').append('svg')
    .attr('width', graphW)
    .attr('height', graphH);


let node = svg.selectAll('.node');
let link = svg.selectAll('.link');

function redraw() {

  link = link.data(force.links(), (d) => `${d.source.id}-${d.target.id}`);
  link.enter().insert('line', '.node').attr('class', 'link');
  link.exit().remove();

  node = node.data(force.nodes(), (d) => d.id);
  node.enter().append('circle').attr('class', 'node').attr('r', 8)
    .call(force.drag)
    .on('mouseover', (d) => {
      // Display venue name to user
      $('#hover-container').removeClass('hide');
      $('#venue-name').text(d.name);
    });
  node.exit().remove();

  force.start();
}

//tick fucntion which enables to get the state of the layout when it has changed
function tick() {
  node.attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y);

  link.attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);
}
