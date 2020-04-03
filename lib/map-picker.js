var flat_data = null;
var width = 960, height = 600, center;
var color_domain = [10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
var ext_color_domain = [0, 10, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
var legend_labels = ["< 10", "50+", "100+", "200+", "300+", "400+", "500+", "600+", "700+", "800+", "900+", "1000+", "1100+"]
var color = d3.scale.threshold()

.domain(color_domain)
.range(["#dcdcdc", "#d0d6cd", "#bdc9be", "#aabdaf", "#97b0a0", "#84a491", "#719782", "#5e8b73", "#4b7e64", "#387255", "#256546", "#125937", "#004d28"]);

var projection = d3.geo.albersUsa();

var path = d3.geo.path()
	.projection(projection);

var zoom = d3.behavior.zoom()
 .translate(projection.translate())
 .scale(projection.scale())
 .scaleExtent([width, 4 * height])
 .on("zoom", zoomed);

var div = d3.select("#container").append("div")
.attr("class", "tooltip")
.style("opacity", 0);

var svg = d3.select("#container").append("svg")
.attr("viewBox", `0 0 ${width} ${height}`)
//.style("margin", "-15px auto");



var g = svg.append("g")
 .call(zoom);

g.append("rect")
	.attr("class", "background")
	.attr("width", width)
	.attr("height", height);


queue()
.defer(d3.json, "testdata/us.json")
.defer((cb) => { load_csse_data().then(d => { cb(null, d); }) })
.await(ready);

function ready(error, us, all_data) {
var pairCaseWithId = {};
var pairNameWithId = {};
flat_data = flatten_all(all_data);

var data = last_day(flat_data).filter(d => !!d.fips);
_.forEach(data, d => { d.id = +d.fips; });

//Moves selction to front
d3.selection.prototype.moveToFront = function() {
	 return this.each(function(){
	 this.parentNode.appendChild(this);
	 });
};

//Moves selction to back
d3.selection.prototype.moveToBack = function() {
	 return this.each(function() {
		 var firstChild = this.parentNode.firstChild;
		 if (firstChild) {
				 this.parentNode.insertBefore(this, firstChild);
		 }
	 });
};

data.forEach(function(d) {
pairCaseWithId[d.id] = +d.confirmed;
pairNameWithId[d.id] = d.county;
});

g.append("g")
	.attr("class", "county")
	.selectAll("path")
		.data(topojson.feature(us, us.objects.counties).features)
	.enter().append("path")
		.attr({
			"d": path,
			"cursor": "pointer"
		})
	.style ( "fill" , function (d) {
	return color (pairCaseWithId[d.id]);
	})
	.style("opacity", 0.8)
	.on("mouseover", function(d) {
	 var sel = d3.select(this);
		 sel.moveToFront();
	d3.select(this).transition().duration(300).style({'opacity': 1, 'stroke': 'black', 'stroke-width': 1.5});
	div.transition().duration(300)
	.style("opacity", 1)
	div.text(pairNameWithId[d.id] + ": " + pairCaseWithId[d.id] + " Cases")
	.style("left", (d3.event.pageX) + "px")
	.style("top", (d3.event.pageY -30) + "px");
	})
	.on("mouseout", function() {
	 var sel = d3.select(this);
		 sel.moveToBack();
	d3.select(this)
	.transition().duration(300)
	.style({'opacity': 0.8, 'stroke': 'white', 'stroke-width': 1});
	div.transition().duration(300)
	.style("opacity", 0);
	})
	//.on("click", clicked)


};

//  g.selectAll("path")
//      .classed("active", centered && function(d) { return d === centered; });

g.transition()
 .duration(250)
.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
.style("stroke-width", 1.5 / k + "px");



function zoomed() {
projection.translate(d3.event.translate).scale(d3.event.scale);
g.selectAll("path").attr("d", path);
}
