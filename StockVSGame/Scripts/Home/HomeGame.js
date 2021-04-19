var serverPath = window.location.host.indexOf('vmjsmarket') >= 0 ? '/StockVSRobot' : '';
var svg, svgVolume, svgRSI;
var interval;
var yAxisCorrect;

//----------買賣價----------
var bPrice = 0; 
var sPrice_Man = 0; 
var sPrice_Robot = 0;
var spread_Man = 0;
var spread_Robot = 0;
var RobotIsSell = 'N';
var RobotIsFirst = 'N';

//----------統計量----------
var gameIsStart = false;
var exeIndex = 0;
var exeRowIndex = 0;
var highestPrice = 0;
var lowestPrice = 9999;
var viewhighestPrice = 0;
var viewlowestPrice = 9999;
var bsCount = 0;
var techKCount = 59;
var arrIndex = 100;
var techKFullData = null;
var rsiFullData = null;
var volumeFullData = null;
var bsLineXCoordinate = 0;
var voidDupArr = [];
var exeIndexArr = [];

//----------K線圖----------
var margin = { top: 20, right: 50, bottom: 30, left: 50 },
    width = 580 - margin.left - margin.right,
    height = 230 - margin.top - margin.bottom;
var xScale = d3.scaleBand().range([0, width]).padding(0.15);
var parseDate = d3.timeParse("%Y%m%d");
var monthDate = d3.timeParse("%Y%m");
var x = techan.scale.financetime()
    .range([0, width]);
var y = d3.scaleLinear()
    .range([height, 0]);
var yR = d3.scaleLinear()
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
var yAxisR = d3.axisRight()
    .scale(yR);

//----------RSI----------
var marginRSI = { top: 5, right: 48, bottom: 25, left: 50 },
    widthRSI = 550 - marginRSI.left - marginRSI.right,
    heightRSI = 120 - marginRSI.top - marginRSI.bottom;
var xRSI = techan.scale.financetime()
    .range([0, widthRSI]);
var yRSI = d3.scaleLinear()
    .range([heightRSI, 0]);
var yRSIR = d3.scaleLinear()
    .range([heightRSI, 0]);
var xAxisRSI = d3.axisBottom(xRSI);
var yAxisRSI = d3.axisLeft(yRSI)
    .tickFormat(d3.format(",.3s"));
var yAxisRSIR = d3.axisRight(yRSIR)
    .tickFormat(d3.format(",.3s"));
var rsi = techan.plot.rsi()
    .xScale(xRSI)
    .yScale(yRSI);

//----------volume----------
var marginVol = { top: 5, right: 50, bottom: 16, left: 50 },
    widthVol = 550 - marginVol.left - marginVol.right,
    heightVol = 120 - marginVol.top - marginVol.bottom;
var xVol = techan.scale.financetime()
    .range([0, widthVol]);
var yVol = d3.scaleLinear()
    .range([heightVol, 0]);
var yVolR = d3.scaleLinear()
    .range([heightVol, 0]);
var volume = techan.plot.volume()
    .accessor(techan.accessor.ohlc())
    .xScale(xVol)
    .yScale(yVol);
var xAxisVol = d3.axisBottom(xVol);
var yAxisVol = d3.axisLeft(yVol)
    .tickFormat(d3.format(",.3s"));
var yAxisVolR = d3.axisRight(yVolR)
    .tickFormat(d3.format(",.3s"));

//----------座標十字線----------
var ohlcAnnotation = techan.plot.axisannotation()
    .axis(yAxis)
    .orient('left')
    .format(d3.format(',.2f'));
var timeAnnotation = techan.plot.axisannotation()
    .axis(xAxis)
    .orient('bottom')
    .format(d3.timeFormat('%Y-%m-%d'))
    .translate([0, height]);
var crosshairY = d3.scaleLinear()
    .range([height, 0]);
var crosshair = techan.plot.crosshair()
    .xScale(x)
    .yScale(crosshairY)
    .xAnnotation(timeAnnotation)
    .yAnnotation(ohlcAnnotation);
var textSvg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var svgText = textSvg.append("g")
    .attr("class", "description")
    .append("text")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "start")
    .text("");

$(document).ready(function () {
    EventBind();
    svg = d3.select("div#CandlestickChart")
        .append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 580 230")
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
    
    if (isRadom === 'Y') {
        var arr = Object.keys(Array.apply(null, { length: stockTotalNum })).map(function(item) {
            return +item;
        });
        exeIndexArr = arr.sort(Shuffle);
        exeIndex = exeIndexArr[exeRowIndex];
    }

    loadJSON(window.location.protocol + '//' + window.location.host + serverPath + "/Scripts/data.json", "date");
});

function Shuffle(a, b) {
    var num = Math.random() > 0.5 ? -1 : 1;
    return num;
}

function EventBind(parameters) {
    $('#StartBtn').click(function () {
        gameIsStart = true;
        var intervalNum = bsCount === 2 ? 200 : 1000;

        if (techKCount < 219) {
            switch (bsCount) {
                case 0:
                    $('#BuyBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_buy0.svg');
                    break;
                case 1:
                    $('#SellBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_sell0.svg');
                    break;
            }

            if (interval === undefined || interval === null) {
                $('#StartBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_pause1.svg');
                interval = setInterval(function() {
                        if (techKCount < techKFullData.length) {
                            techKCount++;
                            redraw(techKFullData, rsiFullData, volumeFullData);
                        } else {
                            clearInterval(interval);
                        }
                    },
                    intervalNum);
            } else {
                $('#StartBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_play_goon.svg');

                clearInterval(interval);
                interval = null;
            }
        }
    });

    $('#BuyBtn').click(function () {
        if (gameIsStart && bsCount < 2 && bsCount !== 1) {
            $('#BuyBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_buyN.svg');
            if (interval === undefined || interval === null) {
                $('#StartBtn').click();
            }
            DrawFlag();
            $('#SellBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_sell0.svg');
        }
    });

    $('#SellBtn').click(function () {
        if (gameIsStart && bsCount < 2 && bsCount > 0) {
            $('#StartBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_pause1.svg');
            $('#SellBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_sellN.svg');
            DrawFlag();
        }
    });

    $('#FightAgainBtn').click(function () {
        $('table tr', 'div#Play').show();
        $('div#Result').hide();
        $('div#Chart').html('');
        $('#StartBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_play0.svg');
        $('#BuyBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_buy0.svg');
        $('#SellBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_sell0.svg');
        svg.selectAll("div#CandlestickChart").remove();//刪除K線圖
        svg.selectAll("div#RSIChart").remove();//刪除RSI
        svg.selectAll("div#VolumeChart").remove();
        svg.selectAll("g#Xaxis").remove();//刪除x座標
        svg.selectAll("g#Yaxis").remove();//刪除y座標
        svg.selectAll("g#flag").remove();
        svg.selectAll("g#Robotflag").remove();

        //----------買賣價初始化----------
        bPrice = 0;
        sPrice_Man = 0;
        sPrice_Robot = 0;
        spread_Man = 0;
        spread_Robot = 0;
        RobotIsSell = 'N';
        RobotIsFirst = 'N';

        //----------統計量初始化----------
        highestPrice = 0;
        lowestPrice = 9999;
        bsCount = 0;
        techKCount = 59;
        arrIndex = 100;
        techKFullData = null;
        rsiFullData = null;
        volumeFullData = null;
        bsLineXCoordinate = 0;

        loadJSON(window.location.protocol + '//' + window.location.host + serverPath + "/Scripts/data.json", "date");
    });
}

function RobotDrawFlag(XCoordinate) {
    var rectGroup = svg.append("g").attr("id", "Robotflag")
        .selectAll("text").data(techKFullData).enter();
    var flagTxt = techKCount === 219 ? '結算出場' : '移動鎖利';

    //線條
    rectGroup.append('line').attr('x1', XCoordinate).attr('y1', 0).attr('x2', XCoordinate).attr('y2', 180)
        .style('stroke', 'white').style('stroke-width', 1);
    //文字框
    rectGroup.append("rect")
        .attr("x", XCoordinate - 79.5) //朝左
        .attr("y",165)
        .attr("width", '80px')
        .attr("height", '15px')
        .attr("fill", 'white')
        .attr("class",
            function (d) {
                if (d.point !== undefined) {
                    if (d.point.type === 'rise') {
                        return "rect_rise";
                    } else {
                        return "rect_fall";
                    }
                } else {
                    return 'none';
                }
            });

    //文字
    rectGroup.append("text")
        .attr("x", XCoordinate - 40) //朝左
        .attr("y", 175)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return flagTxt + ': ' + sPrice_Robot;
        })
        .style('fill', '#000')
        .style('font-size', '0.6vh')
        .attr("class",
            function (d) {
                if (d.point !== undefined) {
                    if (d.point.type === 'rise') {
                        return "rect_txt_rise";
                    } else {
                        return "rect_txt_fall";
                    }
                }
            });
}

function DrawFlag(parameters) {
    var rectGroup = svg.append("g").attr("id", "flag")
        .selectAll("text").data(techKFullData).enter();
    var bsLineStyle = [
        { rect: bsLineXCoordinate - 79.5, text: bsLineXCoordinate - 40, color: 'red', bs: '買進' },
        { rect: bsLineXCoordinate - 0.5, text: bsLineXCoordinate + 40, color: 'green', bs: '賣出' }
    ];

    //買進當天取收盤價當作買進價
    if (bsCount === 0) {
        bPrice = techKFullData[techKCount].close;
        highestPrice = bPrice;
        lowestPrice = bPrice;
        $('span#BPrice').html(bPrice);
        sPrice_Robot = (highestPrice - (highestPrice * (percent / 100))).toFixed(2);
        $('span#TrigPrice_Robot').html(sPrice_Robot);//移動鎖利出場價
        $('#BuyBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_buyN.svg');
    }

    //賣出
    if (bsCount === 1) {
        $('span#SPrice').html(parseFloat(techKFullData[techKCount].close));
        spread_Man = (parseFloat(techKFullData[techKCount].close) - bPrice).toFixed(2);
        $('#SellBtn', $('div#Play')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/bt_sellN.svg');
        clearInterval(interval);
        interval = null;

        interval = setInterval(function () {
            if (techKCount < techKFullData.length) {
                techKCount++;
                redraw(techKFullData, rsiFullData, volumeFullData);
                $('#techK').html(arrIndex);
            } else {
                clearInterval(interval);
            }
        },
            200);
    }

    //線條
    rectGroup.append('line').attr('x1', bsLineXCoordinate).attr('y1', 10).attr('x2', bsLineXCoordinate).attr('y2', 180)
        .style('stroke', bsLineStyle[bsCount].color).style('stroke-width', 1);
    //文字框
    rectGroup.append("rect")
        .attr("x", bsLineStyle[bsCount].rect) //朝左
        .attr("y",
            function (d) {
                if (d.point !== undefined) {
                    return getRectXY(xScale(d.name)).y;
                }
            })
        .attr("width", '80px')
        .attr("height", '15px')
        .attr("fill", bsLineStyle[bsCount].color)
        .attr("class",
            function (d) {
                if (d.point !== undefined) {
                    if (d.point.type === 'rise') {
                        return "rect_rise";
                    } else {
                        return "rect_fall";
                    }
                } else {
                    return 'none';
                }
            });

    //文字
    rectGroup.append("text")
        .attr("x", bsLineStyle[bsCount].text) //朝左
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function (d) {
            return bsLineStyle[bsCount].bs + ': ' + techKFullData[techKCount].close;
        })
        .style('fill', '#FFFFFF')
        .style('font-size', '0.6vh')
        .attr("class",
            function (d) {
                if (d.point !== undefined) {
                    if (d.point.type === 'rise') {
                        return "rect_txt_rise";
                    } else {
                        return "rect_txt_fall";
                    }
                }
            });

    bsCount += 1;
}

function loadJSON(file, type) {
    d3.json(file, function (error, data) {
        var accessor = candlestick.accessor();
        var jsonData = data["Data"][exeIndex];
        var accessorRSI = rsi.accessor();
        var accessorVol = volume.accessor();

        if (voidDupArr.length === 0) voidDupArr.push(exeIndex);
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
        }).sort(function (a, b) { return d3.ascending(accessorVol.d(a), accessorVol.d(b)); });

        techKFullData = data;
        rsiFullData = dataRSI;
        volumeFullData = dataVol;

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
            .attr("id", "yaxisL")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");
        svg.append("g")
            .attr("class", "y axis")
            .attr("id", "yaxisR")
            .attr("transform", "translate(" + width + ",0)")
            .append("text")
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
            .attr("id", "yaxisL")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("RSI");
        svgRSI.append("g")
            .attr("class", "y axis")
            .attr("id", "yaxisR")
            .attr("transform", "translate(" + widthRSI + ",0)")
            .append("text")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        svgVolume.append("g")
            .attr("class", "volume");
        svgVolume.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + heightVol + ")");
        svgVolume.append("g")
            .attr("class", "y axis")
            .attr("id", "yaxisL")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Volume");
        svgVolume.append("g")
            .attr("class", "y axis")
            .attr("id", "yaxisR")
            .attr("transform", "translate(" + widthVol + ",0)")
            .append("text")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        DisplayInfo(jsonData);
        draw(data, dataRSI, dataVol);
    });
}

function draw(data, RSIData, VolumeData) {
    var ma20, ma60;
    var minMA = 9999;
    var rsiData = techan.indicator.rsi()(RSIData.slice(45, RSIData.length - 1));
    techKCount = techKCount + 100;
    
    //K線&均線
    x.domain(data.slice(59, 219).map(candlestick.accessor().d));
    xScale.domain(VolumeData.slice(59, VolumeData.length - 1).map(function (d) { return d.date; }));
    ma20 = techan.indicator.sma().period(20)(data.slice(0, 159));
    ma60 = techan.indicator.sma().period(60)(data.slice(0, 159));
    defaultCandlestick = data.slice(59, 159);
    xScale.range([0, width].map(d => d));
    bsLineXCoordinate = xScale(data[159].date);
    
    //區間最高最低價
    $(data.slice(59, 159)).each(function(idx, el) {
        if (el.high > viewhighestPrice) {
            viewhighestPrice = el.close;
        } else if (el.low <= viewlowestPrice){
            viewlowestPrice = el.close;
        }
    });
    
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
        data.slice(59, 159),
        yAxisCorrect);

    y.domain(techan.scale.plot.ohlc(dataYCorrect, candlestick.accessor()).domain());
    yR.domain(techan.scale.plot.ohlc(dataYCorrect, candlestick.accessor()).domain());
    //----------K線&均線 設定Y軸範圍----------
    
    svg.selectAll("g.candlestick").datum(defaultCandlestick).call(candlestick);
    svg.selectAll("g.x.axis").call(xAxis.ticks(10).tickFormat(d3.timeFormat("%m/%d")));
    svg.selectAll("g#yaxisL").call(yAxis);
    svg.selectAll("g#yaxisR").call(yAxisR);
    svg.select("g.sma.ma-1").attr("clip-path", "url(#candlestickClip)")
        .datum(ma20).call(sma0);
    svg.select("g.ema.ma-2").attr("clip-path", "url(#candlestickClip)")
        .datum(ma60).call(sma0);
    svg.append("defs").append("svg:clipPath")
        .attr("id", "candlestickClip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height);
    svg.append("g")
        .attr("class", "crosshair")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all")
        .call(crosshair);

    //RSI
    xRSI.domain(rsiData.map(rsi.accessor().d));
    yRSI.domain(techan.scale.plot.rsi(rsiData).domain());
    yRSIR.domain(techan.scale.plot.rsi(rsiData).domain());
    svgRSI.selectAll("g.rsi").datum(rsiData.slice(0, 99)).call(rsi);
    svgRSI.selectAll("g.x.axis").call(xAxisRSI.ticks(10).tickFormat(d3.timeFormat("%m/%d")));
    svgRSI.selectAll("g#yaxisL").call(yAxisRSI);
    svgRSI.selectAll("g#yaxisR").call(yAxisRSIR);

    //交易量
    xVol.domain(VolumeData.slice(59, VolumeData.length - 1).map(volume.accessor().d));
    yVol.domain(techan.scale.plot.volume(VolumeData.slice(59, VolumeData.length - 1), volume.accessor().v).domain());
    yVolR.domain(techan.scale.plot.volume(VolumeData.slice(59, VolumeData.length - 1), volume.accessor().v).domain());
    svgVolume.selectAll("g.volume").datum(VolumeData.slice(59, 159)).call(volume);
    svgVolume.selectAll("g.x.axis").call(xAxisVol.ticks(10).tickFormat(d3.timeFormat("%m/%d")));
    svgVolume.selectAll("g#yaxisL").call(yAxisVol);
    svgVolume.selectAll("g#yaxisR").call(yAxisVolR);

    $('span#High').html(viewhighestPrice);
    $('span#Low').html(viewlowestPrice);
    $('span#MAMonth').html(ma20[ma20.length - 1].value.toFixed(2));
    $('span#MASeason').html(ma60[ma60.length - 1].value.toFixed(2));
    $('span#SDT').html(GetYMD(data[59].date));
    $('span#NowDT').html(GetYMD(data[159].date));
    $('span#RSI').html(rsiData[99].rsi.toFixed(2));
}

function GetYMD(parameters) {
    var dt = new Date(parameters);
    var year = dt.getFullYear();
    var month = dt.getMonth() + 1;
    var date = dt.getDate();

    if (month < 10) {
        month = '0' + month;
    }
    if (date < 10) {
        date = '0' + date;
    }

    return year + '/' + month + '/' + date;
}

//產生亂數
function GetRandom(min, max) {
    var num = Math.floor(Math.random() * (max - min + 1)) + min;

    if (voidDupArr.indexOf(num) >= 0) {
        return GetRandom(min, max);
    } else {
        voidDupArr.push(num);
        return num;
    }
};

function redraw(data, RSIData, VolumeData) {
    var ma20, ma60;
    var dataYCorrect = $.extend([], [], data.slice(59, techKCount), yAxisCorrect);
    var rsiData = techan.indicator.rsi()(RSIData.slice(45, RSIData.length - 1));
    
    if (bsCount > 0 && techKCount < 220) {
        //----------更新最高價&移動鎖利出場價----------
        if (parseFloat(data[techKCount].high) > parseFloat(highestPrice)) {
            highestPrice = data[techKCount].high;
            sPrice_Robot = (highestPrice - (highestPrice * (percent / 100))).toFixed(2);
            if (RobotIsSell === 'N') $('span#TrigPrice_Robot').html(sPrice_Robot);
            $('span#High').html(highestPrice);
        }
        //----------更新最低價----------
        else if (parseFloat(data[techKCount].low) <= parseFloat(lowestPrice)) {
            lowestPrice = data[techKCount].low;
            $('span#Low').html(lowestPrice);
        }

        //----------觸發移動鎖利出場----------
        if (parseFloat(data[techKCount].open) <= parseFloat(sPrice_Robot) && RobotIsSell === 'N') {
            sPrice_Robot = data[techKCount].open;
            if (RobotIsSell === 'N') $('span#TrigPrice_Robot').html(sPrice_Robot);
            spread_Robot = (sPrice_Robot - bPrice).toFixed(2);
            RobotIsSell = 'Y';
            RobotDrawFlag(xScale(data[techKCount].date));

            if (bsCount !== 2) {
                RobotIsFirst = 'Y';
            }
        } else if (parseFloat(data[techKCount].high) <= parseFloat(sPrice_Robot) && RobotIsSell === 'N') {
            sPrice_Robot = (sPrice_Robot % 1 === 0)
                ? sPrice_Robot - 0.5
                : (sPrice_Robot - Math.floor(sPrice_Robot)) > 0.5
                ? Math.floor(sPrice_Robot) + 0.5
                    : Math.floor(sPrice_Robot);

            if (RobotIsSell === 'N') $('span#TrigPrice_Robot').html(sPrice_Robot);
            spread_Robot = (sPrice_Robot - bPrice).toFixed(2);
            RobotIsSell = 'Y';
            RobotDrawFlag(xScale(data[techKCount].date));

            if (bsCount !== 2) {
                RobotIsFirst = 'Y';
            }
        }

        //----------最後一天移動鎖利強制出場----------
        if (RobotIsSell === 'N' && techKCount === 219) {
            sPrice_Robot = data[218].close;
            $('span#TrigPrice_Robot').html(sPrice_Robot);
            spread_Robot = (sPrice_Robot - bPrice).toFixed(2);
            RobotIsSell = 'Y';
            RobotDrawFlag(xScale(data[218].date));

            if (bsCount !== 2) {
                RobotIsFirst = 'Y';
            }
        }
        //----------最後一天客戶強制出場----------
        if (bsCount === 1 && techKCount === 219) {
            sPrice_Man = data[218].close;
            $('span#SPrice').html(sPrice_Man);
            spread_Man = (sPrice_Man - bPrice).toFixed(2);
        }
    }
    //---------勝負結算----------
    else if (techKCount === 220) {
        var robot = bsCount === 0 ? '0' : ((spread_Robot / bPrice) * 100).toFixed(2);
        var man = bsCount === 0 ? '0' : ((spread_Man / bPrice) * 100).toFixed(2);
        var resultMsg = '';
        
        if (isRadom === 'Y') {
            if (exeRowIndex < stockTotalNum) {
                exeRowIndex++;
            } else {
                exeRowIndex = 0;
                var arr = Object.keys(Array.apply(null, { length: stockTotalNum })).map(function (item) {
                    return +item;
                });
                exeIndexArr = arr.sort(Shuffle);
            }
            exeIndex = exeIndexArr[exeRowIndex];
        } else {
            if (exeIndex >= stockTotalNum - 1) {
                exeIndex = 0;
            } else {
                exeIndex++;
            }
        }

        highestPrice = 0;
        lowestPrice = 9999;
        viewhighestPrice = 0;
        viewlowestPrice = 9999;
        $('table tr', 'div#Play').hide();
        $('div#Result').show();
        $('div#Result #Man').html(man + '%');
        $('div#Result #Robot').html(robot + '%');
        $('div#Chart').html($('div#CandlestickChart').prop("outerHTML"));
        $('span#TrigPrice_Robot').html('');
        $('span#BPrice').html('');
        $('span#SPrice').html('');
        if (parseFloat(man) >= parseFloat(robot)) {
            $('#Winlose', $('div#Result')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/youwin.png');
        } else {
            $('#Winlose', $('div#Result')).attr('src', window.location.protocol + '//' + window.location.host + serverPath + '/Content/img/youlose.png');
        }
        
        if (bsCount === 0) {
            $('div#Result #Comments').html('找不到時機進場嗎?試試挑戰新行情');
            return false;
        }
        //移動鎖利贏
        if (parseFloat(spread_Robot) > parseFloat(spread_Man)) {
            if (robot >= 15) {
                if (RobotIsFirst === 'Y') {
                    $('div#Result #Comments').html(resultMsg + '適時的停損停利才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
                } else {
                    $('div#Result #Comments').html(resultMsg + '快快出場雖然可以降低風險，但是也可能錯失股價上漲潛力唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
                }
            } else if (robot < 15 && robot > 0) {
                if (RobotIsFirst === 'Y') {
                    $('div#Result #Comments').html(resultMsg + '行情波動大時適時的出場才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定');
                } else {
                    $('div#Result #Comments').html(resultMsg + '快快出場雖然可以降低風險，但是也可能錯失股價上漲潛力唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
                }
            } else if (robot <= 0) {
                if (RobotIsFirst === 'Y') {
                    $('div#Result #Comments').html(resultMsg + '行情波動大時適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
                } else {
                    $('div#Result #Comments').html(resultMsg + '行情波動大時適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
                }
            } else {
                $('div#Result #Comments').html(resultMsg + '行情波動大時適時的出場才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定');
            }
        }
        else if (parseFloat(spread_Robot) < parseFloat(spread_Man)) {
            if (man >= 15) {
                if (RobotIsFirst === 'Y') {
                    $('div#Result #Comments').html(resultMsg + '您的操作習慣很能掌握大行情，不過還是要注意波動風險唷,透過日盛移動鎖利幫助你有更穩定的操作績效');
                } else {
                    $('div#Result #Comments').html(resultMsg + '行情波動時你對於風控的處理很棒唷~');
                }
            } else if (man < 15 && man > 0) {
                if (RobotIsFirst === 'Y') {
                    $('div#Result #Comments').html(resultMsg + '行情波動時你對於風控的處理很棒唷~');
                } else {
                    $('div#Result #Comments').html(resultMsg + '行情波動時你對於風控的處理很棒唷~');
                }
            } else if (man <= 0) {
                if (RobotIsFirst === 'Y') {
                    $('div#Result #Comments').html(resultMsg + '行情波動時你對於風控的處理很棒唷~');
                } else {
                    $('div#Result #Comments').html(resultMsg + '行情波動時你對於風控的處理很棒唷~');
                }
            } else {
                $('div#Result #Comments').html(resultMsg + '行情波動劇烈，你對於風控的處理很棒唷~');
            }
        } else {
            $('div#Result #Comments').html(resultMsg + '行情波動時你對於風控的處理很棒唷~');
        }

        resultMsg = $('div#Result #Comments').html();
        //---------通用評語----------
        if (resultMsg === '') {
            if (man >= robot) {
                $('div#Result #Comments').html(resultMsg + '擁抱操作部位忍受行情波動是贏家必備條件，不過損失太大時也要記得停損唷');
            } else {
                $('div#Result #Comments').html(resultMsg + '適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            }
        }

        clearInterval(interval);
        interval = null;

        return false;
    }

    //區間最高最低價
    if (parseFloat(data[techKCount].high) > parseFloat(viewhighestPrice)) {
        viewhighestPrice = data[techKCount].high;
        $('span#High').html(viewhighestPrice);
    } else if (parseFloat(data[techKCount].low) <= parseFloat(viewlowestPrice)) {
        viewlowestPrice = data[techKCount].low;
        $('span#Low').html(viewlowestPrice);
    }

    //K線&均線
    ma20 = techan.indicator.sma().period(20)(data.slice(0, techKCount));
    ma60 = techan.indicator.sma().period(60)(data.slice(0, techKCount));
    y.domain(techan.scale.plot.ohlc(dataYCorrect, candlestick.accessor()).domain());
    yR.domain(techan.scale.plot.ohlc(dataYCorrect, candlestick.accessor()).domain());
    bsLineXCoordinate = xScale(data[techKCount].date);

    svg.selectAll("g.candlestick").datum(data.slice(59, techKCount)).call(candlestick);
    svg.selectAll("g#yaxisL").call(yAxis);
    svg.selectAll("g#yaxisR").call(yAxisR);
    svg.select("g.sma.ma-1").attr("clip-path", "url(#candlestickClip)")
        .datum(ma20).call(sma0);
    svg.select("g.ema.ma-2").attr("clip-path", "url(#candlestickClip)")
        .datum(ma60).call(sma0);
    svg.append("defs").append("svg:clipPath")
        .attr("id", "candlestickClip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height);
    svg.append("g")
        .attr("class", "crosshair")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all")
        .call(crosshair);

    //RSI
    svgRSI.selectAll("g.rsi").datum(rsiData.slice(0, arrIndex++)).call(rsi);
    svgRSI.selectAll("g.x.axis").call(xAxisRSI);
    svgRSI.selectAll("g#yaxisL").call(yAxisRSI);
    svgRSI.selectAll("g#yaxisR").call(yAxisRSIR);

    //交易量
    svgVolume.selectAll("g.volume").datum(VolumeData.slice(59, techKCount)).call(volume);
    svgVolume.selectAll("g.x.axis").call(xAxisVol);
    svgVolume.selectAll("g#yaxisL").call(yAxisVol);
    svgVolume.selectAll("g#yaxisR").call(yAxisVolR);

    $('span#MAMonth').html(ma20[ma20.length - 1].value.toFixed(2));
    $('span#MASeason').html(ma60[ma60.length - 1].value.toFixed(2));
    $('span#SDT').html(GetYMD(data[59].date));
    $('span#NowDT').html(GetYMD(data[techKCount].date));
    $('span#RSI').html(rsiData[techKCount-60].rsi.toFixed(2));
}

function DisplayInfo(parameters) {
    $('span#Stock').html(parameters[0][2] + parameters[0][1]);
}
