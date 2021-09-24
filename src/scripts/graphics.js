import * as d3 from 'd3';
let pymChild = null // for embedding

const margin = { top: 30, left: 50, right: 0, bottom: 60 };
const height = 460 - margin.top - margin.bottom;
const width = 700 - margin.left - margin.right;

const svg = d3
	.select('#lineChart')
	.append('svg')
	.attr('height', height + margin.top + margin.bottom)
	.attr('width', width + margin.left + margin.right)
	.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Scales
const xPositionScale = d3.scaleBand().range([0, width]);
const yPositionScale = d3.scaleLinear().range([height, 0]);

d3.csv(require("/data/cleaned_comm_data.csv"))
  .then(ready)
  .catch(err => console.log('Failed on', err))

function ready (data){
  data = data.filter(d=>d.year > 2009)
  const nested = d3.nest().key(d=>d.county).entries(data)
  let options = nested.map(function(d){
    return d.key
  })

  d3.select('#county')
    .selectAll('option.opt')
    .data(options)
    .enter()
    .append('option')
    .attr('class','opt')
    .attr('value',d=>d)
    .text(d=>d);
  
  // update scales
  xPositionScale.domain(data.map((d) => d.year))
  yPositionScale.domain([0, d3.max(data.map((d) => +d.commission))]);

   // draw axis

  const yOptions = d3.axisLeft(yPositionScale)
  const yAxis = svg.append('g').attr('class', 'axis y-axis').call(yOptions);

  const xOptions = d3.axisBottom(xPositionScale);
  const xAxis = svg
        .append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', 'translate(0,'+ height + ')')
        .call(xOptions);

  const rectChart = svg
                      .selectAll("rect")
                      .data(data.filter(d=>d.county=='Statewide'))
                      .join('rect')
                      .attr("fill", "#d95f0e")
                      .style('opacity', 0.6)
                      .raise()



    d3.select('#county')
      .on('change', function(){
        const selectedCounty = d3.select('#county').node().value

        const filteredData = data.filter(d=>d.county == selectedCounty && +d.commission !=null)
        yPositionScale.domain([0, d3.max(filteredData.map((d) => +d.commission))]);
        rectChart.data(filteredData).attr('x', function(d){
          return xPositionScale(+d.year)
        }).attr('y', function(d){
          return yPositionScale(+d.commission)
        }).attr("height", function(d){return height-yPositionScale(+d.commission)})

        yAxis.call(yOptions).select(".domain").remove()        
        xAxis.call(xOptions).select(".domain").remove()     

  
  })

  // resize function + on start
	function render() {
		const svgContainer = svg.node().closest('div');
		const svgWidth = svgContainer.offsetWidth;
		// Do you want it to be full height? Pick one of the two below
		const svgHeight = height + margin.top + margin.bottom;
		// const svgHeight = window.innerHeight

		const actualSvg = d3.select(svg.node().closest('svg'));
		actualSvg.attr('width', svgWidth).attr('height', svgHeight);

		const newWidth = svgWidth - margin.left - margin.right;
		const newHeight = svgHeight - margin.top - margin.bottom;

		// Update our scale
		xPositionScale.range([0, newWidth]);
		yPositionScale.range([newHeight, 0]);
    xPositionScale.domain(data.map((d) => d.year))


		// axis updated
		yAxis
			.call(
				yOptions
					.tickSizeInner(-newWidth)
					.tickPadding(10)
					.ticks(6)
					.tickFormat(d3.format("$.2s"))
			)
      .select(".domain").remove()

		xAxis
			.call(
				xOptions
					.tickPadding(10)
          // .ticks(0)
					.tickFormat(d3.format('d'))
			).select(".domain").remove()
        
      xAxis.selectAll(".tick")
        .each(function (d, i) {
            if ((newWidth < 400) && (i == 1 || i == 3 || i == 5 || i==7 || i==9)) {
                this.remove();
            }
        });

      rectChart.attr('x', function(d){
        return xPositionScale(+d.year)
      }).attr('y', function(d){
        return yPositionScale(+d.commission)
      }).attr("height", function(d){return newHeight-yPositionScale(+d.commission)}).attr("width", xPositionScale.bandwidth()-2).raise()
    
      } 

      // // kick off the graphic and then listen for resize events
	render();
	window.addEventListener('resize', render);

	// // for the embed, don't change!
	if (pymChild) pymChild.sendHeight();
	pymChild = new pym.Child({ polling: 200, renderCallback: render });

}
