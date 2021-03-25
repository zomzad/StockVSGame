var serverPath = window.location.host.indexOf('localhost') >= 0 ? '' : '/StockVSRobot';
var svg, svgVolume, svgRSI;
//----------K線圖----------
var margin = { top: 20, right: 50, bottom: 30, left: 50 },
    width = 580 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;
var parseDate = d3.timeParse("%Y%m%d");
var x = techan.scale.financetime()
    .range([0, width]);
var y = d3.scaleLinear()
    .range([height, 0]);
var sma0 = techan.plot.sma()
    .xScale(x)
    .yScale(y);
var sma1 = techan.plot.sma()
    .xScale(x)
    .yScale(y);
var candlestick = techan.plot.candlestick()
    .xScale(x)
    .yScale(y);
var xAxis = d3.axisBottom()
    .scale(x);
var yAxis = d3.axisLeft()
    .scale(y);

//----------RSI----------
var marginRSI = { top: 20, right: 48, bottom: 25, left: 50 },
    widthRSI = 550 - marginRSI.left - marginRSI.right,
    heightRSI = 150 - marginRSI.top - marginRSI.bottom;
var xRSI = techan.scale.financetime()
    .range([0, widthRSI]);
var yRSI = d3.scaleLinear()
    .range([heightRSI, 0]);
var xAxisRSI = d3.axisBottom(xRSI);
var yAxisRSI = d3.axisLeft(yRSI)
    .tickFormat(d3.format(",.3s"));
var rsi = techan.plot.rsi()
    .xScale(xRSI)
    .yScale(yRSI);

//----------volume----------
var marginVol = { top: 5, right: 50, bottom: 30, left: 50 },
    widthVol = 550 - marginVol.left - marginVol.right,
    heightVol = 120 - marginVol.top - marginVol.bottom;
var xVol = techan.scale.financetime()
    .range([0, widthVol]);
var yVol = d3.scaleLinear()
    .range([heightVol, 0]);
var volume = techan.plot.volume()
    .accessor(techan.accessor.ohlc())
    .xScale(xVol)
    .yScale(yVol);
var xAxisVol = d3.axisBottom(xVol);
var yAxisVol = d3.axisLeft(yVol)
    .tickFormat(d3.format(",.3s"));

$(document).ready(function() {
    EventBind();
    svg = d3.select("div#CandlestickChart")
        .append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 580 200")
        .attr("pointer-events", "all")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    svgVolume = d3.select('div#VolumeChart').append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 550 120")
        .attr("pointer-events", "all")
        .append("g")
        .attr("transform", "translate(" + marginVol.left + "," + marginVol.top + ")");
    svgRSI = d3.select('div#RSIChart').append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 550 150")
        .attr("pointer-events", "all")
        .append("g")
        .attr("transform", "translate(" + marginRSI.left + "," + marginRSI.top + ")");
    loadJSON(window.location.protocol + '//' + window.location.host + serverPath + "/Scripts/data.json", "date");
});

function EventBind(parameters) {
    $('#StartBtn').click(function () {
        if (techKCount < 219 || bsLineCount === 2) {
            if (interval === undefined || interval === null) {
                $(this).attr('src', serverPath + '/Content/img/bt_pause1.svg');
                interval = setInterval(function () {
                        if (techKCount < chartData.length) {
                            techKCount++;
                            redraw(chartData, rsiChartData);
                            $('#techK').html(count);
                        } else {
                            clearInterval(interval);
                        }
                    },
                    1000);
            } else {
                if (bsLineCount < 2) {
                    $(this).attr('src', serverPath + '/Content/img/bt_play0.svg');
                    clearInterval(interval);
                    interval = null;
                }
            }
        }
    });
}

function loadJSON(file, type) {
    d3.json(file, function (error, data) {
        var accessor = candlestick.accessor();
        var jsonData = data["Data"][0];
        var accessorRSI = rsi.accessor();
        var accessorVol = volume.accessor();

        data = jsonData.map(function (d) {
            if (type === "date") {
                return {
                    date: parseDate(d[0]),
                    open: +d[3],//開盤價
                    high: +d[4],//最高價
                    low: +d[5],//最低價
                    close: +d[6],//收盤價
                    volume: +d[9],//成交量
                    change: d[6] - d[3],//漲跌
                    percentChange: +d[8]//漲跌幅度(%)
                };
            } else {
                return {
                    date: monthDate(d[0]),
                    open: +d[3],
                    high: +d[4],
                    low: +d[5],
                    close: +d[6],
                    volume: +d[10],
                    change: d[6] - d[3],
                    percentChange: +d[8]
                };
            }
        }).sort(function (a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

        var dataRSI = jsonData.map(function (d) {
            return {
                date: parseDate(d[0]),
                volume: +d[9],
                open: +d[3],
                high: +d[4],
                low: +d[5],
                close: +d[6]
            };
        }).sort(function (a, b) { return d3.ascending(accessorRSI.d(a), accessorRSI.d(b)); });

        var dataVol = jsonData.map(function (d) {
            return {
                date: parseDate(d[0]),
                volume: +d[9],
                open: +d[3],
                high: +d[4],
                low: +d[5],
                close: +d[6]
            };
        }).sort(function (a, b) { return d3.ascending(accessor.d(a), accessor.d(b)); });

        svg.append("g")
            .attr("class", "candlestick");
        svg.append("g")
            .attr("class", "sma ma-1");
        svg.append("g")
            .attr("class", "ema ma-2");
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")");

        svg.append("g")
            .attr("class", "y axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        svgRSI.append("g")
            .attr("class", "rsi");
        svgRSI.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + heightRSI + ")");
        svgRSI.append("g")
            .attr("class", "y axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("RSI");

        svgVolume.append("g")
            .attr("class", "volume");

        svgVolume.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + heightVol + ")");

        svgVolume.append("g")
            .attr("class", "y axis")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Volume");

        draw(data, dataRSI, dataVol);
    });
}

function draw(data, RSIData, VolumeData) {
    debugger;
    var ma20, ma60;
    var minMA = 9999;
    var rsiData = techan.indicator.rsi()(RSIData.slice(45, RSIData.length - 1));

    //K線&均線
    x.domain(data.slice(59, data.length - 1).map(candlestick.accessor().d));
    ma20 = techan.indicator.sma().period(20)(data.slice(0, 159));
    ma60 = techan.indicator.sma().period(60)(data.slice(0, 159));
    defaultCandlestick = data.slice(59, 158);
    $(ma20.slice(59, 159)).each(function (idx, el) {
        if (el.value < minMA) {
            minMA = el.value;
        }
    });
    $(ma60).each(function (idx, el) {
        if (el.value < minMA) {
            minMA = el.value;
        }
    });
    //----------K線&均線 設定Y軸範圍----------
    yAxisCorrect = [
        {
            date: data[0].date,
            open: minMA,
            high: minMA,
            low: minMA,
            close: minMA,
            volume: 2569,
            change: 1,
            percentChange: -2.6
        }
    ];

    dataYCorrect = $.extend([], [],
        data.slice(59, 158),
        yAxisCorrect);

    y.domain(techan.scale.plot.ohlc(dataYCorrect, candlestick.accessor()).domain());
    //----------K線&均線 設定Y軸範圍----------

    svg.selectAll("g.candlestick").datum(defaultCandlestick).call(candlestick);
    svg.selectAll("g.x.axis").call(xAxis);
    svg.selectAll("g.y.axis").call(yAxis);
    svg.select("g.sma.ma-1").attr("clip-path", "url(#candlestickClip)")
        .datum(ma20).call(sma0);
    svg.select("g.ema.ma-2").attr("clip-path", "url(#candlestickClip)")
        .datum(ma60).call(sma0);
    svg.append("defs").append("svg:clipPath")
        .attr("id", "candlestickClip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height);

    //RSI
    xRSI.domain(rsiData.map(rsi.accessor().d));
    yRSI.domain(techan.scale.plot.rsi(rsiData).domain());
    svgRSI.selectAll("g.rsi").datum(rsiData.slice(0, 99)).call(rsi);
    svgRSI.selectAll("g.x.axis").call(xAxisRSI);
    svgRSI.selectAll("g.y.axis").call(yAxisRSI);

    //交易量
    xVol.domain(VolumeData.slice(59, VolumeData.length - 1).map(volume.accessor().d));
    yVol.domain(techan.scale.plot.volume(VolumeData.slice(59, VolumeData.length - 1), volume.accessor().v).domain());
    svgVolume.selectAll("g.volume").datum(VolumeData.slice(59, 158)).call(volume);
    svgVolume.selectAll("g.x.axis").call(xAxisVol);
    svgVolume.selectAll("g.y.axis").call(yAxisVol);

    //$('span#High').html(highestPrice);
    //$('span#Low').html(lowestPrice);
    //$('span#MAMonth').html(ma20[ma20.length - 1].value.toFixed(2));
    //$('span#MASeason').html(ma60[ma60.length - 1].value.toFixed(2));
    //$('span#SDT').html(GmtToYMD(data[59].date));
    //$('span#NowDT').html(GmtToYMD(data[99].date));
    //$('span#RSI').html(rsiData[99].rsi.toFixed(2));
}
