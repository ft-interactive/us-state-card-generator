var width = 300,
	height = 576,
	projection = d3.geo.albersUsa()
		.scale(70)
		.translate([268, 30]),
	path = d3.geo.path()
		.projection(projection),
		background,
		states;

// Draw divs to hold the cards

var main = d3.select('main');
var cards = main.selectAll('div.card')
	.data(spreadsheet.data)
	.enter()
	.append('div.card');

// Add buttons to each, for downloading the PNGs

var buttons = cards.append('button').html(function(d){
	return 'Download ' + d.state + ' as image (PNG)'
}).on('click',function(d){
	var fileName = d.code + '-state-card.png';
	saveSvgAsPng(document.getElementById(d.code), fileName)
});

// Draw the fundamentals of the cards -- header, footer, background etc

var svg = cards.append('svg')
	.attr({
		id:function(d){return d.code},
		width:width,
		height:height
	})
	.style({
		width:width + 'px',
		height:height + 'px'
	});

var whiteCard = svg.append('rect#whiteCard')
	.attr({
		rx:3,
		width:width,
		height:height,
		fill:'#FFFFFF'
	});

var greyHeader = svg.append('rect#grey-header')
	.attr({
		width:width,
		height:60,
		rx:3
	})
	.style({
		'stroke-opacity':0.2,
		stroke:'#000000',
		fill:'#3A3A36'
	});

var cardFooter = svg.append('rect#card-footer')
	.attr({
		x:0,
		y:543,
		width:width,
		height:32,
		rx:3
	})
	.style({
		'stroke-opacity':0.2,
		stroke:'#000000',
		fill:'#3A3A36'
	});

var branding = svg.append('text.white.faded.upper')
	.attr({
		x:width-13,
		y:height-11,
		'text-anchor':'end'
	})
	.style({
		'font-size':'16px'
	})
	.html('Financial Times');

// Add the first state-specific elements: state titles, numbers of votes

var stateTitle = svg.append('text.white.stateTitle')
	.attr({
		x:13,
		y:30
	})
	.html(function(d){return d.state});

var electoralVotes = svg.append('text.white.faded.electoralVotes')
	.attr({
		x:13,
		y:51
	});

electoralVotes.append('tspan.voteNum').html(function(d){return d.votes + ' '});
electoralVotes.append('tspan.voteText').html('ELECTORAL VOTES');

// Set the stage for the historical results section -- title, legend

var history = svg.append('text.history')
	.attr({
		x:13,
		y:90
	})
	.html('VOTING HISTORY (winner&rsquo;s margin of victory, %)');

var historyKey = svg.append('g.historyKey').translate([10,90]);

historyKey.append('rect.Rep')
	.attr({
		x:3,
		width:8,
		y:8,
		height:12
	});

historyKey.append('text.history')
	.attr({
		x:13,
		y:19
	})
	.html('Republican');

historyKey.append('rect.Dem')
	.attr({
		x:78,
		width:8,
		y:8,
		height:12
	});

historyKey.append('text.history')
	.attr({
		x:88,
		y:19
	})
	.html('Democrat');

// Set up scales & axes for the historical bars

var x = d3.scale.linear()
	.range([30,width-40])
	.domain([1972,2020]);

var y = d3.scale.linear()
	.range([200,100])
	.domain([0,0.9]);

var xa = d3.svg.axis()
	.scale(x)
	.tickValues([1972,1980,1988,2000,2012,2020])
	.tickSize(5)
	.outerTickSize(0)
	.tickFormat(function(d){
		if(d==1972 || d==2000){
			return d3.format('d')(d)
		}else if(d==2020){
			return 2016
		}else{
			return (d).toString().substring(2,4)
		}
	});

var ya = d3.svg.axis()
	.orient('right')
	.scale(y)
	.tickValues([0,0.2,0.4])
	.tickSize(-(width-45))
	.outerTickSize(0)
	.tickFormat(d3.format('%'));

var xs = svg.append('g.scale.x')
	.translate([0,200])
	.call(xa);

var ys = svg.append('g.scale.y')
	.translate([width-30,0])
	.call(ya);

// Add a break in the horizontal ticks to show that 2016 is dictinct from the rest

svg.selectAll('.y .tick line')
	.style({
		'stroke-dasharray':'21 13 300'
	});

// Set up some cross-hatching patterns to use later on the polling bars

var defs = svg.append('defs');
defs.append('pattern#hatch')
	.attr({
		width:4,
		height:4,
		patternTransform:'rotate(45)',
		patternUnits:'userSpaceOnUse'
	})
	.append('rect')
	.attr({
		x:0,
		width:3,
		y:0,
		height:4
	})
	.style({
		fill:'#FFFFFF'
	});

defs.append('mask#mask')
	.append('rect')
	.attr({
		x:0,
		height:'100%',
		y:0,
		width:'100%',
		fill:'url(#hatch)'
	});

// Now the main state-by-state work:

svg.each(function(a,b){

	var thisCard = d3.select(this);

	// Get the historical results

	var histArray = [a.outcome1972, a.outcome1976, a.outcome1980, a.outcome1984, a.outcome1988, a.outcome1992, a.outcome1996, a.outcome2000, a.outcome2004, a.outcome2008, a.outcome2012, 0];

	// And generate a URL for the json endpoints of the polling data

	var pollUrl = 'https://ft-ig-us-elections-polltracker.herokuapp.com/polls/' + a.code.toLowerCase() + '.json';

	var months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

	// Grab that polling data, add a bar and label for the latest data point if any exist

	d3.json(pollUrl, function(error, poll){
		var latest = poll.filter(function(d){return d.candidatename == 'Trump' || d.candidatename == 'Clinton'}).slice(-2);
		if(latest.length > 0){
			if(latest[0].candidatename == 'Trump'){
				histArray.push((latest[1].pollaverage-latest[0].pollaverage)/100);	
			}else{
				histArray.push((latest[0].pollaverage-latest[1].pollaverage)/100);
			}
			thisCard.append('text.history')
				.attr({
					'text-anchor':'end',
					x:width-23,
					y:109
				})
				.tspans(['Latest poll margin',
					 'as of ' + d3.time.format("%Y-%m-%d").parse(latest[0].updatedAt.toString().substring(0,10)).getDate() + ' ' + months[d3.time.format("%Y-%m-%d").parse(latest[0].updatedAt.toString().substring(0,10)).getMonth()] + ' ' +  d3.time.format("%Y-%m-%d").parse(latest[0].updatedAt.toString().substring(0,10)).getFullYear()
					])
				.attr({
					'text-anchor':'end',
					x:width-23
				});
			thisCard.append('path.history')
				.attr({
					d:'M' + (width-40) + ',' + '126l0,15l-3,-4l3,4l3,-4'
				})
				.style({
					fill:'none',
					stroke:'#000000'
				})
		}else{
			thisCard.append('text.history')
				.attr({
					'text-anchor':'end',
					x:width-23,
					y:109
				})
				.tspans(['No','polling','data'])
				.attr({
					'text-anchor':'end',
					x:width-23
				});
		}

	var historyBars = thisCard.append('g.historyBars').selectAll('rect.historyBar').data(histArray).enter()
		.append('rect')
		.attr({
			x:function(d,i){return x(1972 + 4*i)-8},
			width:16,
			y:function(d,i){return y(Math.abs(d))},
			height:function(d,i){return y(0)-y(Math.abs(d))},
			class:function(d){return d < 0 ? 'historyBar Rep':' historyBar Dem'}
		})
	});

	// Now draw each state's minimap

	d3.json('./scripts/states.json', function(error, us){
		if (error) throw error;

		// This block draws all states *except* the one in question. It's our background layer

		background = thisCard.selectAll('path.background').data(topojson.feature(us, us.objects.cb_2014_us_state_20m).features.filter(function(d){
			return d.properties.STUSPS != a.code
		}));
		background.enter().append('path.background')
		.attr({
			d:path
		});

		// This one draws *only* the  state in question, and highlights it

		states = thisCard.selectAll('path.state').data(topojson.feature(us, us.objects.cb_2014_us_state_20m).features.filter(function(d){
			return d.properties.STUSPS == a.code
		}));
		states.enter().append('path')
		.attr({
			class:function(d,i){return 'state '+ d.properties.STUSPS.toLowerCase()},
			d:path
		})
		.classed('highlight',function(d,i){return d.properties.STUSPS == a.code})
		.style({
			fill:'#FFFFFF',
			stroke:'#FFFFFF'
		});
	});

});

// Now onto the bottom half of the cards: 'key data'. First the separating key line, plus title and legend

var keyLine = svg.append('line.keyLine')
	.attr({
		x1:13,
		x2:width-13,
		y1:250,
		y2:250
	});

var keyTitle = svg.append('text.keyData')
	.attr({
		x:13,
		y:270
	})
	.html('KEY DATA (%)');

svg.append('rect.Purple')
	.attr({
		x:13,
		width:8,
		y:277,
		height:12
	});

svg.append('text.keyData')
	.attr({
		x:23,
		y:288
	})
	.html(function(d){return d.state});

svg.append('rect.Gray')
	.attr({
		x:133,
		width:8,
		y:277,
		height:12
	});

svg.append('text.keyData')
	.attr({
		x:143,
		y:288
	})
	.html('US average');

// Now the section headings for each subset of data

var sectionLabs = ['WAGE GROWTH', 'UNEMPLOYMENT' ,'POVERTY RATE', 'COLLEGE EDUCATED', 'HISPANIC POPULATION' ,'AFRICAN-AMERICAN POPULATION'];

var sectionKeys = ['wagegrowth2015', 'unemployment', 'poverty', 'graduates', 'hispanic', 'africanamerican'];

var maxes = [];

sectionKeys.forEach(function(d,i){
	maxes.push(d3.max(spreadsheet.data, function(d){return d[sectionKeys[i]]}))
});

var sections = svg.selectAll('g.keySection').data(sectionLabs).enter()
	.append('g.keySection')
	.translate(function(d,i){
		var xPos = i % 2,
			yPos = Math.floor(i/2);
		return [xPos * (width/2), 310 + (yPos*85)]
	});

var sectionHeaders = sections.append('text.header.history')
	.tspans(function(d){return d3.wordwrap(d, 25)})
	.attr({
		x:width/4,
		'text-anchor':'middle'
	});

var stateNums = sections.append('text.stateNum')
	.attr({
		x:width/4-20,
		y:45,
		'text-anchor':'end'
	})
	.html(function(d,i){
		return d3.format('.1f')(d3.select(this).node().parentNode.parentNode.__data__[sectionKeys[i]]*100);
	});

var usNums = sections.append('text.usNum')
	.attr({
		x:width/4+20,
		y:45
	})
	.html(function(d,i){
		return [4.4,4.9,13.5,29.3,17.6,13.3][i]
	});

var stateBars = sections.append('rect.Purple')
	.attr({
		x:width/4-15,
		width:13,
		y:function(d,i){
			return 45 - (((d3.select(this).node().parentNode.parentNode.__data__[sectionKeys[i]])/maxes[i])*30)
		},
		height:function(d,i){
			return (((d3.select(this).node().parentNode.parentNode.__data__[sectionKeys[i]])/maxes[i])*30)
		}
	});

var usBars = sections.append('rect.Gray')
	.attr({
		x:width/4+2,
		width:13,
		y:function(d,i){
			return 45 - (([4.4,4.9,13.5,29.3,17.6,13.3][i]/maxes[i]/100)*30)
		},
		height:function(d,i){
			return (([4.4,4.9,13.5,29.3,17.6,13.3][i]/maxes[i]/100)*30)
		}
	});