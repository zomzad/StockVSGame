var serverPath = window.location.host.indexOf('localhost') >=0 ? '' : '/StockVSRobot';
var svg, svgVolume, svgRSI;
//買賣點X座標
var bsLineXCoordinate = 0;  
//K線完整資料
var techKFullData = null;   
//區間最高價
var highestPrice = 0; 
//區間最低價
var lowestPrice = 9999; 
//買進價
var bPrice = 0;      
//玩家賣出價
var sPrice_Man = 0;  
//機器人觸發出場價
var sPrice_Robot = 0;   
//價差_人
var spread_Man = 0;   
//價差_移動鎖利 
var spread_Robot = 0;
//移動鎖利是否賣出
var RobotIsSell = 'N';
//移動鎖利是否先出場
var RobotIsFirst = 'N';
//配合均線校正Y座標範圍
var yAxisCorrect;
var bsLineCount = 0;
var dataArr;
var chartData;
var rsiChartData;
var techKCount = 59;
var count = 0;
var interval;
var rescaledX, rescaledY;
//K線圖主體的長寬(非外框)
var margin = { top: 20, right: 50, bottom: 15, left: 60 },
    width = 580 - margin.left - margin.right,
    height = 320 - margin.top - margin.bottom;
//成交量主體的長寬(非外框)
var marginVolume = { top: 20, right: 48, bottom: 25, left: 50 },
    widthVolume = 550 - marginVolume.left - marginVolume.right,
    heightVolume = 120 - marginVolume.top - marginVolume.bottom;
//RSI主體的長寬(非外框)
var marginRSI = { top: 20, right: 48, bottom: 25, left: 50 },
    widthRSI = 550 - marginRSI.left - marginRSI.right,
    heightRSI = 150 - marginRSI.top - marginRSI.bottom;
var aspect = width / height;
// 設定時間格式
var parseDate = d3.timeParse("%Y%m%d");
var monthDate = d3.timeParse("%Y%m");

// K線圖X的比例尺
var x = techan.scale.financetime()
    .range([0, width]);
var crosshairY = d3.scaleLinear()
    .range([height, 0]);
// K線圖Y的比例尺
var y = d3.scaleLinear()
    .range([height - 80, 0]);
// 成交量的y
var yVolume = d3.scaleLinear()
    .range([height, height - 60]);
//成交量的x
var xScale = d3.scaleBand().range([0, width]).padding(0.15);

var sma0 = techan.plot.sma()
    .xScale(x)
    .yScale(y);

var sma1 = techan.plot.sma()
    .xScale(x)
    .yScale(y);
var ema2 = techan.plot.ema()
    .xScale(x)
    .yScale(y);
var candlestick = techan.plot.candlestick()
    .xScale(x)
    .yScale(y);
//設定縮放大小1 ~ 5倍
var zoom = d3.zoom()
    .scaleExtent([1, 5])
    .translateExtent([[0, 0], [width, height]])
    .extent([[margin.left, margin.top], [width, height]])
    .on("zoom", zoomed);

var zoomableInit, yInit;
var xAxis = d3.axisBottom()
    .scale(x);
var yAxis = d3.axisLeft()
    .scale(y);
var yAxisR = d3.axisRight()
    .scale(y);
var volumeAxis = d3.axisLeft(yVolume)
    .ticks(4)
    .tickFormat(d3.format(",.3s"));
var ohlcAnnotation = techan.plot.axisannotation()
    .axis(yAxis)
    .orient('left')
    .format(d3.format(',.2f'));
var timeAnnotation = techan.plot.axisannotation()
    .axis(xAxis)
    .orient('bottom')
    .format(d3.timeFormat('%Y-%m-%d'))
    .translate([0, height]);

// 設定十字線
var crosshair = techan.plot.crosshair()
    .xScale(x)
    .yScale(crosshairY)
    .xAnnotation(timeAnnotation)
    .yAnnotation(ohlcAnnotation);

// 設定文字區域
var textSvg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//設定顯示文字，web版滑鼠拖曳就會顯示，App上則是要點擊才會顯示
var svgText = textSvg.append("g")
    .attr("class", "description")
    .append("text")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "start")
    .text("");

//------------RSI------------
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

$(document).ready(function () {
    //設定畫圖區域
    EventBind();
    svg = d3.select("div#CandlestickChart")
        .append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 580 320")
        .attr("pointer-events", "all")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svgRSI = d3.select('div#RSIChart').append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 550 150")
        .attr("pointer-events", "all")
        .append("g")
        .attr("transform", "translate(" + marginRSI.left + "," + marginRSI.top + ")");

    svgVolume = d3.select('div#VolumeChart').append("svg")
        .attr("preserveAspectRatio", "xMidYMid")
        .attr("viewBox", "0 0 550 120")
        .attr("pointer-events", "all")
        .append("g")
        .attr("transform", "translate(" + marginVolume.left + "," + marginVolume.top + ")");

    loadJSON(window.location.protocol + '//' + window.location.host + serverPath + "/Scripts/data.json", "date");
});

function EventBind(parameters) {
    $('#BuyBtn').click(function () {
        if (bsLineCount < 2 && interval !== null && interval !== undefined) {
            DrawFlag();
        }
    });

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

    $('button#StopBtn').click(function () {
        if (bsLineCount < 2) {
            clearInterval(interval);
            interval = null;
        }
    });

    $('#SellBtn').click(function () {
        if (bsLineCount < 2 && bsLineCount > 0 && interval !== null) {
            DrawFlag();
        }
    });

    $('button#AgainBtn').click(function () {
        clearInterval(interval);
        svg.selectAll("div#CandlestickChart").remove();//刪除K線圖
        svg.selectAll("div#RSIChart").remove();//刪除RSI
        svg.selectAll(".volumeBar").remove();
        svg.selectAll("g#flag").remove();//刪除買賣標記
        svg.selectAll("g#Xaxis").remove();//刪除x座標
        svg.selectAll("g#Yaxis").remove();//刪除y座標
        interval = null;

        loadJSON(window.location.protocol + '//' + window.location.host + serverPath + "/Scripts/data.json", "date");
    });
}

function DrawFlag(parameters) {
    var rectGroup = svg.append("g").attr("id", "flag")
        .selectAll("text").data(techKFullData).enter();
    var bsLineStyle = [
        { rect: bsLineXCoordinate - 49.5, text: bsLineXCoordinate - 25, color: 'red', bs: '買進' },
        { rect: bsLineXCoordinate - 0.5, text: bsLineXCoordinate + 25, color: 'green', bs: '賣出' }
    ];

    //買進時先預設買進價為最高價
    if (bsLineCount === 0) {
        highestPrice = parseFloat(techKFullData[techKCount-1].close);
        bPrice = highestPrice;
        $('span#BPrice').html(bPrice);
    }

    //賣出
    if (bsLineCount === 1) {
        $('span#SPrice').html(parseFloat(techKFullData[techKCount-1].close));
        spread_Man = (parseFloat(techKFullData[techKCount-1].close) - bPrice).toFixed(2);
        clearInterval(interval);
        interval = null;

        interval = setInterval(function() {
                if (techKCount < chartData.length) {
                    techKCount++;
                    redraw(chartData, rsiChartData);
                    $('#techK').html(count);
                } else {
                    clearInterval(interval);
                }
            },
            200);
    }

    //線條
    rectGroup.append('line').attr('x1', bsLineXCoordinate).attr('y1', 10).attr('x2', bsLineXCoordinate).attr('y2', 205)
        .style('stroke', bsLineStyle[bsLineCount].color).style('stroke-width', 1);
    //文字框
    rectGroup.append("rect")
        .attr("x", bsLineStyle[bsLineCount].rect) //朝左
        .attr("y",
            function(d) {
                if (d.point !== undefined) {
                    return getRectXY(xScale(d.name)).y;
                }
            })
        .attr("width", '50px')
        .attr("height", '15px')
        .attr("fill", bsLineStyle[bsLineCount].color)
        .attr("class",
            function(d) {
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
        .attr("x", bsLineStyle[bsLineCount].text) //朝左
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .text(function(d) {
            return bsLineStyle[bsLineCount].bs + ': ' + techKFullData[techKCount - 1].close;
        })
        .style('fill', '#FFFFFF')
        .attr("class",
            function(d) {
                if (d.point !== undefined) {
                    if (d.point.type === 'rise') {
                        return "rect_txt_rise";
                    } else {
                        return "rect_txt_fall";
                    }
                }
            });

    bsLineCount += 1;
}

function loadJSON(file, type) {
    //svg.selectAll("div#CandlestickChart").remove(); // 切換不同資料需要重新畫圖，因此需要先清除原先的圖案
    d3.json(file, function (error, data) {
        var accessor = candlestick.accessor();//技術線圖
        var jsonData = data["Data"][0];
        var accessorRSI = rsi.accessor();//RSI

        //============RSI============
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
        //============RSI============

        data =
            jsonData
                .map(function (d) { // 設定data的格式
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
        
        var newData = jsonData.map(function (d) {
            if (type === "date") {
                return {
                    date: parseDate(d[0]),
                    volume: d[9]
                };
            } else {
                return {
                    date: monthDate(d[0]),
                    volume: d[10]
                };
            }

        }).reverse();

        svg.append("g")
            .attr("class", "candlestick");
        svg.append("g")
            .attr("class", "sma ma-0");
        svg.append("g")
            .attr("class", "sma ma-1");
        svg.append("g")
            .attr("class", "ema ma-2");
        svg.append("g")
            .attr("class", "volume axis");
        svg.append("g").attr("id", "Xaxis")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")");

        svg.append("g").attr("id", "Yaxis")
            .attr("class", "y axis")
            .append("text")
            .attr("y", -5)
            .attr("x", 45)
            .attr("font-size", '8px')
            .style("text-anchor", "end");
            //.text("價格 (TWD)");

            svg.append("g").attr("id", "YaxisR")
                .attr("class", "y axis")
                .append("text")
                .attr("y", -5)
                .attr("x", 5)
                .attr("font-size", '8px')
                .style("text-anchor", "end");
            //.text("價格 (TWD)");
        
        chartData = data;
        rsiChartData = dataRSI;
        techKFullData = data;//K線完整資料
        $('span#Stock').html(jsonData[0][2] + jsonData[0][1]);
        draw(data, dataRSI, newData);
    });
}

function draw(data, RSIData, volumeData) {
    var ma20, ma60;
    var minMA = 9999;
    var dataYCorrect;
    var defaultCandlestick;
    var rsiData = techan.indicator.rsi()(RSIData.slice(45, RSIData.length - 1));//配合月線、季線第60天才有完整資料，RSI依樣從第60天開始顯示，但RSI需要近14天的資料，所以60-14 = 45
    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);
    // 針對K線圖的，讓他不會蓋到成交量bar chart
    var candlestickClip = svg.append("defs").append("svg:clipPath")
        .attr("id", "candlestickClip")
        .append("svg:rect")
        .attr("width", width)
        .attr("height", height - 60)
        .attr("x", 0)
        .attr("y", 0);

    //座標區間設定
    x.domain(data.slice(59, data.length - 1).map(candlestick.accessor().d));
    xScale.domain(volumeData.slice(59, volumeData.length - 1).map(function (d) { return d.date; }));
    yVolume.domain(techan.scale.plot.volume(data.slice(59, 158)).domain());
    
    defaultCandlestick = data.slice(59, 158); //先顯示100天K棒，第60天開始才有完整的月線季線資料
    CompareHighLow(defaultCandlestick);//計算區間最高低價&機器人出場價格
    techKCount = techKCount + 99;//實際在第X筆資料
    count = count + 100;//印出幾天
    xScale.range([0, width].map(d => d)); // 設定xScale回到初始值
    svg.each(function () {
        var selection = d3.select(this);
        // 畫成交量bar chart
        var chart = selection.selectAll("volumeBar")
            .append("g")
            .data(defaultCandlestick)
            .enter().append("g")
            .attr("clip-path", "url(#clip)");

        chart.append("rect")
            .attr("class", "volumeBar")
            .attr("x", function(d) { return bsLineXCoordinate = xScale(d.date); })
            .attr("height",
                function(d) {
                    return height - yVolume(d.volume);
                })
            .attr("y",
                function(d) {
                    return yVolume(d.volume);
                })
            .attr("width", xScale.bandwidth())
            .style("fill",
                function(d, i) { //根據漲跌決定成交量顏色
                    if (defaultCandlestick[i].change > 0) {
                        return '#FF0000'
                    } else if (defaultCandlestick[i].change < 0) {
                        return "#00AA00";
                    } else {
                        return "#DDDDDD";
                    }
                });

        ma20 = techan.indicator.sma().period(20)(data.slice(0, 159));
        ma60 = techan.indicator.sma().period(60)(data.slice(0, 159));
        selection.select("g.sma.ma-1").attr("clip-path", "url(#candlestickClip)")
            .datum(ma20).call(sma0);
        selection.select("g.ema.ma-2").attr("clip-path", "url(#candlestickClip)")
            .datum(ma60).call(sma0);
        selection.select("g.volume.axis").call(volumeAxis);
        selection.append("g")
            .attr("class", "crosshair")
            .attr("width", width)
            .attr("height", height)
            .attr("pointer-events", "all")
            .call(crosshair);
        //.call(zoom);

        //取得月&季線最小值，設定Y軸，避免只用收盤價設定Y軸，均線下緣超過圖表
        $(ma20.slice(59, 159)).each(function(idx, el) {
            if (el.value < minMA) {
                minMA = el.value;
            }
        });
        $(ma60).each(function(idx, el) {
            if (el.value < minMA) {
                minMA = el.value;
            }
        });
    });

    //----------設定Y軸範圍----------
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
    //----------設定Y軸範圍----------

    // 畫X軸 
    svg.selectAll("g.x.axis")
        .call(xAxis.ticks(7).tickFormat(d3.timeFormat("%m/%d")).tickSize(-height, -height));
    //畫K線圖Y軸
    svg.selectAll("g.y.axis").call(yAxis.ticks(10).tickSize(-width, -width));
    svg.selectAll("g#YaxisR").call(yAxisR.ticks(10).tickSize(width + 15, width + 15));
    
    //畫Ｋ線圖
    svg.select("g.candlestick").attr("clip-path", "url(#candlestickClip)").datum(defaultCandlestick)
        .call(candlestick);
    svg.select("g.sma.ma-1").attr("clip-path", "url(#candlestickClip)")
        .datum(ma20).call(sma0);
    svg.select("g.ema.ma-2").attr("clip-path", "url(#candlestickClip)")
        .datum(ma60).call(sma0);
    svg.select("g.volume.axis").call(volumeAxis);
    svg.append("g")
        .attr("class", "crosshair")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all")
        .call(crosshair);

    xRSI.domain(rsiData.map(rsi.accessor().d));
    yRSI.domain(techan.scale.plot.rsi(rsiData).domain());
    svgRSI.selectAll("g.rsi").datum(rsiData.slice(0, 99)).call(rsi);
    svgRSI.selectAll("g.x.axis").call(xAxisRSI);
    svgRSI.selectAll("g.y.axis").call(yAxisRSI);

    //設定zoom的初始值
    zoomableInit = x.zoomable().clamp(false).copy();
    yInit = y.copy();
    $('span#High').html(highestPrice);
    $('span#Low').html(lowestPrice);
    $('span#MAMonth').html(ma20[ma20.length - 1].value.toFixed(2));
    $('span#MASeason').html(ma60[ma60.length - 1].value.toFixed(2));
    $('span#SDT').html(GmtToYMD(data[59].date));
    $('span#NowDT').html(GmtToYMD(data[99].date));
    $('span#RSI').html(rsiData[99].rsi.toFixed(2));
}

function CompareHighLow(parameters) {
    $(parameters).each(function(idx, el) {
        if (el.close > highestPrice) {
            highestPrice = el.close;
        }

        if (el.close < lowestPrice) {
            lowestPrice = el.close;
        }
    });

    sPrice_Robot = (highestPrice - (highestPrice * (percent / 100))).toFixed(2);
    $('span#TrigPrice_Robot').html(sPrice_Robot);//觸發出場價
}

function GmtToYMD(parameters) {
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

function zoomed() {
    //根據zoom去取得座標轉換的資料
    t = d3.event.transform;
    rescaledX = d3.event.transform.rescaleY(x);
    rescaledY = d3.event.transform.rescaleY(y);
    // y座標zoom
    yAxis.scale(rescaledY);
    candlestick.yScale(rescaledY);
    sma0.yScale(rescaledY);
    sma1.yScale(rescaledY);
    ema2.yScale(rescaledY);

    x.zoomable().domain(d3.event.transform.rescaleX(zoomableInit).domain());
    xScale.range([0, width].map(d => d3.event.transform.applyX(d)));

    // 更新座標資料後，再重新畫圖
    //redraw(techKFullData);
}

function redraw(data, RSIData) {
    //勝負計算
    if (techKCount === 220) {
        var robot = ((spread_Robot / bPrice) * 100).toFixed(2);
        var man = ((spread_Man / bPrice) * 100).toFixed(2);

        if (bsLineCount === 0) {
            alert('找不到時機進場嗎?');
            return false;
        }

        //客戶&移動鎖利都出場 移動鎖利先出場
        if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot > 15 && man > 15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('您的操作習慣很能掌握大行情，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                alert('您的操作習慣很能掌握大行情，不過獲利也要適時賣出唷,透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            }
        } else if (RobotIsFirst === 'N' && bsLineCount === 2 && (robot > 15 && man > 15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('太厲害了，不過太早決定出場也很容易錯失大行情唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                alert('太棒了，不過太早決定出場很容易錯失大行情唷，可以再想想出場時機唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔~');
            }
        } else if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot < 15 && man > 15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('您的操作習慣很能掌握大行情，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                //無此狀況
            }
        }else if (RobotIsFirst === 'N' && bsLineCount === 2 && (robot < 15 && man > 15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('太棒了，不過太早決定出場很容易錯失大行情唷，可以再想想出場時機唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                //無此狀況
            }
        } else if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot > 15 && man < 15)) {
            if (spread_Man - spread_Robot > 0) {
                //無此狀況
            } else {
                alert('您的操作習慣很能掌握大行情，不過獲利也要適時賣出唷,透過日盛移動鎖利幫助你有更穩定的操作績效');
            }
        }else if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot < 15 && man < 15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('行情波動劇烈，你對於風控的處理很棒唷');
            } else {
                alert('行情波動劇烈，你對於風控的處理很棒唷');
            }
        } else if (RobotIsFirst === 'N' && bsLineCount === 2 && (robot < 15 && man < 15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('行情波動劇烈，你對於風控的處理很棒唷');
            } else {
                alert('行情波動劇烈，你對於風控的處理很棒唷');
            }
        }
        //--------------------------------賠錢-----------------------------------------
        else if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot > -15 && man > -15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                alert('適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            }
        } else if (RobotIsFirst === 'N' && bsLineCount === 2 && (robot > -15 && man > -15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                alert('適時的停損才能保全您的資金唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            }
        } else if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot > -15 && man < -15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('擁抱操作部位忍受行情波動是贏家必備條件，不過損失太大時也要記得停損唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                //無此狀況
            }
        }else if (RobotIsFirst === 'N' && bsLineCount === 2 && (robot > -15 && man < -15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('快快停損雖然可以降低虧損，但是也可能錯失股價上漲潛力唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                //無此狀況
            }
        } else if (RobotIsFirst === 'Y' && bsLineCount === 2 && (robot < -15 && man < -15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('行情波動劇烈，你對於風控的處理很棒唷');
            } else {
                alert('行情波動劇烈，你對於風控的處理很棒唷');
            }
        } else if (RobotIsFirst === 'N' && bsLineCount === 2 && (robot < -15 && man < -15)) {
            if (spread_Man - spread_Robot > 0) {
                alert('太早決定出場很容易錯失大行情唷，可以再想想出場時機唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            } else {
                alert('太早決定出場很容易錯失大行情唷，可以再想想出場時機唷，透過日盛移動鎖利可以幫助您有更穩定的操作績效喔');
            }
        }

        clearInterval(interval);
        interval = null;

        return false;
    }

    var dataYCorrect = $.extend([], [],
        data.slice(59, techKCount),
        yAxisCorrect);

    y.domain(techan.scale.plot.ohlc(dataYCorrect, candlestick.accessor()).domain());
    yVolume.domain(techan.scale.plot.volume(data.slice(59, techKCount)).domain());
    //畫K線圖Y軸
    svg.selectAll("g.y.axis").call(yAxis.ticks(10).tickSize(-width, -width));
    svg.selectAll("g#YaxisR").call(yAxisR.ticks(10).tickSize(width + 15, width + 15));
    $('g[clip-path="url(#clip)"]').remove();

    var ma20 = techan.indicator.sma().period(20)(data.slice(0, techKCount));
    var ma60 = techan.indicator.sma().period(60)(data.slice(0, techKCount));
    var chart = svg.selectAll("volumeBar")
        .append("g")
        .data(data.slice(59, techKCount))
        .enter().append("g")
        .attr("clip-path", "url(#clip)");

    
    if (data[techKCount].close > highestPrice) {
        highestPrice = data[techKCount].close;
        sPrice_Robot = (highestPrice - (highestPrice * (percent / 100))).toFixed(2);
    }
    if (data[techKCount].close <= lowestPrice) {
        lowestPrice = data[techKCount].close;

        if (RobotIsSell === 'N') {
            sPrice_Robot = data[techKCount].close;//機器人觸發出場
            spread_Robot = (sPrice_Robot - bPrice).toFixed(2); //機器人報酬
            RobotIsSell = 'Y';

            if (bsLineCount !== 2) {
                RobotIsFirst = 'Y';
            }
        }
    }
    if (RobotIsSell === 'N' && techKCount === 219) {
        sPrice_Robot = data[219].close; //用最後這天當機器人賣出價
        spread_Robot = (sPrice_Robot - bPrice).toFixed(2); //機器人報酬
        if (bsLineCount !== 2) {
            RobotIsFirst = 'Y';
        }
    }

    chart.append("rect")
        .attr("class", "volumeBar")
        .attr("x", function (d) { return bsLineXCoordinate = xScale(d.date); })
        .attr("height", function (d) {
            return height - yVolume(d.volume);
        })
        .attr("y", function (d) {
            return yVolume(d.volume);
        })
        .attr("width", xScale.bandwidth())
        .style("fill", function (d, i) {
            if (data.slice(59, techKCount)[i].change > 0) { return "#FF0000" } else if (data.slice(59, techKCount)[i].change < 0) {
                return "#00AA00";
            } else {
                return "#DDDDDD";
            }
        });

    svg.select("g.candlestick").attr("clip-path", "url(#candlestickClip)").datum(data.slice(59, techKCount))
        .call(candlestick);
    svg.select("g.sma.ma-1").attr("clip-path", "url(#candlestickClip)")
        .datum(ma20).call(sma0);
    svg.select("g.ema.ma-2").attr("clip-path", "url(#candlestickClip)")
        .datum(ma60).call(sma0);
    svg.select("g.volume.axis").call(volumeAxis);
    svg.append("g")
        .attr("class", "crosshair")
        .attr("width", width)
        .attr("height", height)
        .attr("pointer-events", "all")
        .call(crosshair);

    var rsiData = techan.indicator.rsi()(RSIData.slice(45, RSIData.length - 1));
    svgRSI.selectAll("g.rsi").datum(rsiData.slice(0, count -1)).call(rsi);

    $('span#High').html(highestPrice);
    $('span#Low').html(lowestPrice);
    $('span#MAMonth').html(ma20[ma20.length - 1].value.toFixed(2));
    $('span#MASeason').html(ma60[ma60.length - 1].value.toFixed(2));
    $('span#NowDT').html(GmtToYMD(data[techKCount].date));
    $('span#RSI').html(rsiData[count - 1].rsi.toFixed(2));
    $('span#TrigPrice_Robot').html(sPrice_Robot);
    count++;
}