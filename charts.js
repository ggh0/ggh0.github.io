// Below reads in data from CSV, and creates line chart and heatmap using the data

    let lineChart = d3.select("#lineChart").append("g")
    .attr("class","lineChart")
    .attr("transform","translate(250,20)")

    let tooltipLine
    let focusPoint
    let focusPointSelected
    
    let tooltipDateFormat = d3.timeFormat("%B %Y")

    let options = null

    const parseDate = d3.timeParse("%Y-%m-%d")
    
    let data
    d3.csv("pivotedResults.csv", d => ({
        date: parseDate(d.REF_DATE),
        AB: +d.AB,
        All: +d.All,
        BC: +d.BC,
        F: +d.F,
        M: +d.M,
        MB: +d.MB,
        NB: +d.NB,
        NL: +d.NL,
        NS: +d.NS,
        ON: +d.ON,
        PE: +d.PE,
        QC: +d.QC,
        SK: +d.SK,
        years15to24: +d.years15to24,
        years25to54: +d.years25to54,
        years55andover: +d.years55andover,
        Recession: +d.Recession
    })).then((loadedData) => {
        data = loadedData
        showLineChart()
        showHeatMap()
    })
    

    let xScale
    let yScale

    function setOptions(opt) {
        if (opt==="null") options=null
        else if (opt==="M") options=["gender","M","Men"]
        else if (opt==="F") options=["gender","F","Women"]
        else if (opt==="years15to24") options=["age","years15to24", "15 to 24 years"]
        else if (opt==="years25to54") options=["age","years25to54", "24 to 55 years"]
        else if (opt==="years55andover") options=["age","years55andover", "55+ years"]
        else if (opt==="AB") options=["province","AB", "Alberta"]
        else if (opt==="BC") options=["province","BC", "British Columbia"]
        else if (opt==="MB") options=["province","MB", "Manitoba"]
        else if (opt==="NB") options=["province","NB", "New Brunswick"]
        else if (opt==="NL") options=["province","NL", "Newfoundland & Labrador"]
        else if (opt==="NS") options=["province","NS", "Nova Scotia"]
        else if (opt==="ON") options=["province","ON", "Ontario"]
        else if (opt==="PE") options=["province","PE", "Prince Edward Island"]
        else if (opt==="QC") options=["province","QC", "Quebec"]
        else if (opt==="SK") options=["province","SK", "Saskatchewan"]
        
        d3.selectAll("button").attr("class",null)
        if (options) d3.select("#"+options[1]).attr("class","selectedButton")
        else d3.select("#Overall").attr("class","selectedButton")

        lineChart.remove()
        lineChart = d3.select("svg").append("g")
            .attr("class","lineChart")
            .attr("transform","translate(250,20)")
        if (data) showLineChart()

        d3.select(".heatmap-cells").remove()
        d3.select(".decade-labels").remove()
        
        d3.select("#heatMap").append("div").attr("class","heatmap-cells").attr("height","300").attr("width","816")
            .style("float","left").style("position","relative").style("box-sizing","border-box")
        d3.select(".heatmap-cells").append("div").attr("class","heatmap-tooltip").append("p").attr("class","tooltip-date")
        d3.select(".heatmap-tooltip").append("div").attr("class","tooltip-row").append("p").attr("class","tooltip-figure")
        d3.select("#heatMap-container").append("div").attr("class","decade-labels")
        
        if (data) showHeatMap()
        
    }

    function showLineChart() {

        let lineChartHeight = 100
        let lineChartWidth = 540
    
        let maxValue

        // calculate the maxValue for use in the y-axis scale
        if (options && options[0]==="age") {
            maxValue = d3.max(data, (d) => Math.max(d.All, d.years15to24, d.years25to54, d.years55andover))    
        } else if (options && options[0]==="province") {
            maxValue = d3.max(data, (d) => Math.max(d.All, d.AB, d.BC, d.MB, d.NB, d.NL, d.NS, d.ON, d.PE, d.QC, d.SK))
        } else maxValue = d3.max(data, (d) => Math.max(d.All, d.F, d.M))
        
        // function to calculate the scale for y-axis
        yScale = d3.scaleLinear()
            .range([lineChartHeight, 0])
            .domain([0, Math.ceil(maxValue)+0.1]);
        
        // Adds y-axis
        lineChart.append("g")
            .attr("class","yaxis")
            .call(d3.axisLeft(yScale).ticks(3)
                .tickValues([0, Math.round(maxValue/2), Math.ceil(maxValue)]).tickSizeOuter(0));

        // function to calculate the scale for x-axis
        xScale = d3.scaleTime()
                    .domain(d3.extent(data, d => d.date))
                    .range([0, lineChartWidth]);
        
        // Adds x-axis
        lineChart.append("g")
            .attr("class","xaxis")
            .attr("transform", "translate(0," + lineChartHeight + ")")
            .call(d3.axisBottom(xScale).ticks(5)
                .tickFormat(d3.timeFormat("%Y")).tickSizeOuter(0))

        // Add recession areas, hardcoded based on data
        
        lineChart.append("rect").attr("height",lineChartHeight).attr("width",16).attr("y",0).attr("x",xScale(new Date(1981,05,01))).attr("fill","lightgrey")
        lineChart.append("rect").attr("height",lineChartHeight).attr("width",25).attr("y",0).attr("x",xScale(new Date(1990,02,01))).attr("fill","lightgrey")
        lineChart.append("rect").attr("height",lineChartHeight).attr("width",7).attr("y",0).attr("x",xScale(new Date(2008,09,01))).attr("fill","lightgrey")
        lineChart.append("rect").attr("height",lineChartHeight).attr("width",8).attr("y",0).attr("x",xScale(new Date(2020,02,01))).attr("fill","lightgrey")

        // Create Overall line details
        let valueline = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.All))

        // Add line chart for Overall data
        lineChart.append("path")
            .datum(data)
            .attr("d", valueline)
            .attr("class", "line");

        // Below creates the other subset lines
        if (options && options[0]==="gender") {
            for (group of ["M","F"]) {
                let line = d3.line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d[group]))
                
                if (group===options[1]) {
                    lineChart.append("path")
                        .datum(data)
                        .attr("d", line)
                        .attr("class", "selectedline");
                } else {
                    lineChart.append("path")
                        .datum(data)
                        .attr("d", line)
                        .attr("class", "otherline");
                }
            }
        }

        if (options && options[0]==="age") {
            for (group of ["years15to24","years25to54", "years55andover"]) {
                let line = d3.line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d[group]))
                
                if (group===options[1]) {
                    lineChart.append("path")
                        .datum(data)
                        .attr("d", line)
                        .attr("class", "selectedline");
                } else {
                    lineChart.append("path")
                        .datum(data)
                        .attr("d", line)
                        .attr("class", "otherline");
                }
            }
        }

        if (options && options[0]==="province") {
            for (group of ["AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK"]) {
                let line = d3.line()
                    .x(d => xScale(d.date))
                    .y(d => yScale(d[group]))
                
                if (group===options[1]) {
                    lineChart.append("path")
                        .datum(data)
                        .attr("d", line)
                        .attr("class", "selectedline");
                } else {
                    lineChart.append("path")
                        .datum(data)
                        .attr("d", line)
                        .attr("class", "otherline");
                }
            }
        }

        // Function to find the closest X index of the mouse:
        let bisect = d3.bisector(function(d) { return d.date; }).left

        tooltipLine = lineChart.append('line')
            .attr('y1', 0)
            .attr('y2', lineChartHeight)
            .attr('x1',0)
            .attr('x2',0)
            .attr('stroke', 'black')
            .attr("visibility","hidden")

        //Draw svg labels for linechart
        let tooltip = lineChart.append('g').attr('class','lineTooltipGroup')
        tooltip.append('rect').attr('class','lTGrect rectMonth').attr('fill','black').attr("height","27").attr("y","-37").attr("x","15").attr("stroke","black").attr("stroke-width","0.2").style("visibility","hidden")
        tooltip.append('rect').attr('class','lTGrect rectOverall').attr('fill','white').attr("height","25").attr("y","-10").attr("x","15").attr("stroke","black").attr("stroke-width","0.2").style("visibility","hidden")
        tooltip.append('rect').attr('class','lTGrect rectSelected').attr('fill','white').attr("height","25").attr("y","15").attr("x","15").attr("stroke","black").attr("stroke-width","0.2").style("visibility","hidden")
        tooltip.append('text').attr('class','lTGtext textMonth').attr('fill','white').attr("y","-18").attr("x","22").style("visibility","hidden")
        tooltip.append('text').attr('class','lTGtext textOverall').attr('fill','black').attr("y","8").attr("x","22").style("visibility","hidden")
        tooltip.append('text').attr('class','lTGtext textSelected').attr('fill','blue').attr("y","34").attr("x","22").style("visibility","hidden")


        focusPoint = lineChart
                        .append('g')
                        .append('circle')
                        .attr("display","none")
                        .style("fill", "solid")
                        .attr("stroke", "black")
                        .attr('r', 2)

        focusPointSelected = lineChart
                                .append('g')
                                .append('circle')
                                .attr("display","none")
                                .style("fill", "solid")
                                .attr("stroke", "blue")
                                .attr('r', 2)

        // Create a rectangle on top of the chart area: this triggers the mouseover
        lineChart
            .append('rect')
            .style("fill", "none")
            .style("pointer-events", "all")
            .attr('width', lineChartWidth)
            .attr('height', lineChartHeight)
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseout', mouseout);

        function mouseover() {
            fpMouseover()
            lcLineMouseover()
            
            tooltip.select(".textMonth").style("visibility","visible")
            tooltip.select(".rectMonth").style("visibility","visible")
            tooltip.select(".textOverall").style("visibility","visible")
            tooltip.select(".rectOverall").style("visibility","visible")
            if (options) {
                tooltip.select(".textSelected").style("visibility","visible")
                tooltip.select(".rectSelected").style("visibility","visible")
            }

            point = xScale.invert(d3.pointer(event)[0])
            i = bisect(data, point, 0);
            selectedData = data[i]
            dateSelected = data[i].date
            month = dateSelected.getMonth()
            year = dateSelected.getYear()-75
            hmHighlightMouseout()
            hmHighlightMouseover(d3.selectAll("div[month='"+month+"'][year='"+year+"']"))
        }

        function mousemove(event) {
            let x0 = xScale.invert(d3.pointer(event)[0]);
            let i = bisect(data, x0, 0);
            selectedData = data[i]
            dateSelected = data[i].date

            fpMousemove(selectedData)
            lcLineMousemove(dateSelected)

            tooltip.select(".textMonth").text(tooltipDateFormat(selectedData.date))
            tooltip.select(".textOverall").text("Overall: "+selectedData.All+"%")
            if (options)
                tooltip.select(".textSelected").text(options[2]+": "+selectedData[options[1]]+"%")

            let tooltipWidth = Math.max(tooltip.select(".textOverall").node().getBBox().width,
                                        tooltip.select(".textMonth").node().getBBox().width,
                                        tooltip.select(".textSelected").node().getBBox().width)
            
            let tooltipPos = (xScale(selectedData.date)*2 < lineChartWidth) ? xScale(selectedData.date)-5 : xScale(selectedData.date)-tooltipWidth-40

            tooltip.attr("transform","translate("+(tooltipPos)+",20)")
            tooltip.selectAll('rect').attr("width",tooltipWidth+15)
            
            hmHighlightMouseout()
            month = dateSelected.getMonth()
            year = dateSelected.getYear()-75
            hmHighlightMouseover(d3.selectAll("div[month='"+month+"'][year='"+year+"']"))
        }

        function mouseout() {

            fpMouseout()
            lcLineMouseout()
            tooltip.selectAll("rect").style("visibility","hidden")
            tooltip.selectAll("text").style("visibility","hidden")

            hmHighlightMouseout()
        }
    }


    function showHeatMap() {

        minYear = d3.min(data, d => d.date.getYear())
        maxYear = d3.max(data, d => d.date.getYear())

        // Heatmap colours
        colorValues=["rgb(82, 160, 69)","rgb(99, 188, 81)","rgb(162, 210, 146)","rgb(198, 226, 186)","rgb(238, 226, 189)",
        "rgb(255, 214, 61)", "rgb(249, 162, 36)", "rgb(238, 58, 67)", "rgb(206, 49, 57)"]

        let cells = d3.select(".heatmap-cells")
        year = 0
        month = 0
        decade=0
        for (let cell=0; cell < data.length; cell++) {
            if (cell%12===0) {
                year++
                curYear = cells.append("div").attr("class","yearcol").style("float","left")
            }
            if (data[cell].date.getYear() % 10 === 0 && month===0) decade++
            
            if (options) {
                choice = data[cell][options[1]]
            }
            else {
                choice = data[cell].All
            }
            
            if (choice < 4)
                color = 0
            else if (choice < 5)
                color = 1
            else if (choice < 6)
                color = 2
            else if (choice < 7)
                color = 3
            else if (choice < 8)
                color = 4
            else if (choice < 9)
                color = 5
            else if (choice < 10)
                color = 6
            else if (choice < 11)
                color = 7
            else
                color = 8


            addedCell = curYear
                .append("div","month")
                .attr("year",year)
                .attr("month",month)
                .attr("decade",decade)
                .attr("recession",data[cell].Recession)
                .attr("cellnum",cell)
                .style("width","12px")
                .style("height","25px")
                .style("background-color",colorValues[color])
                .style("border","1px solid white")
                .style("box-sizing","border-box")
                .on('mouseover', mouseover)
                .on('mouseout', mouseout);

            if (data[cell].Recession) {
                addedCell.append("div").style("width","4px").style("height","4px").style("background-color","grey").style("margin","10px 3px")
            }

            month++
            if (month===12) month=0
            

        }

        // Create the labels at x-axis of heatmap
        decadeLabels = d3.select(".decade-labels")
        
        decadeLabels.append("div").style("width","120px").attr("decade","1").style("margin-left","108px").attr("class","1").append("p").text("1980")
        decadeLabels.append("div").style("width","120px").attr("decade","2").append("p").text("'90")
        decadeLabels.append("div").style("width","120px").attr("decade","3").append("p").text("2000")
        decadeLabels.append("div").style("width","120px").attr("decade","4").append("p").text("'10")
        decadeLabels.append("div").style("width","20px").attr("decade","5").append("p").text("'20")
        
        
        let hmTooltip = d3.select(".heatmap-tooltip").style("display","none")
        
        
        function mouseover(event) {
            hmTooltip.style("display", "block")
                .style("left", (event.clientX+20) + "px")
                .style("top", (event.clientY-20) + "px")

            
            selected = d3.select(this)
            hmHighlightMouseover(selected)

            lcLineMouseover()
            month = +selected.attr("month")
            year = +selected.attr("year")+75-100+2000
            idx = +selected.attr("cellnum")
            
            lcLineMousemove(new Date(year,month,1))

            fpMouseover()
            fpMousemove(data[idx])

            d3.select(".tooltip-date").text(tooltipDateFormat(data[idx].date))
            if (options)
                d3.select(".tooltip-figure").text(options[2]+": "+data[idx][options[1]]+"%")
            else
                d3.select(".tooltip-figure").text("Overall: " + data[idx].All + "%")


        }

        function mouseout() {
            hmTooltip.style("display", "none")
            hmHighlightMouseout()
            
            lcLineMouseout()
            fpMouseout()
        }


    }

    // Below handles mouseover events for both graphs, made global so that the mouseover affects both
    // graphs for certain effects
    let yHMLabel
    let xHMLabel
    let hmSelected
    function hmHighlightMouseover(selected) {
        hmSelected = selected.style("border","2px solid black")
        let month = selected.attr("month")
        let decade = selected.attr("decade")
        
        yHMLabel = d3.selectAll(".heatmap-month-label[month='"+month+"']").style("font-weight","bold")
        xHMLabel = decadeLabels.selectAll("[decade='"+decade+"']").style("font-weight","bold")
    }

    function hmHighlightMouseout() {
        if (hmSelected) {
            hmSelected.style("border","1px solid white")
            yHMLabel.style("font-weight","normal")
            xHMLabel.style("font-weight","normal")
        }
    }

    function lcLineMouseover() {
        tooltipLine.attr('visibility', 'visible')
    }
    
    function lcLineMousemove(pos) {
        day = xScale(pos)
        tooltipLine.attr("transform","translate("+(day)+",0)")
    }

    function lcLineMouseout() {
        tooltipLine.attr('visibility', 'hidden')
    }
    
    function fpMouseover() {
        focusPoint.style("display", "block")
        if (options) focusPointSelected.style("display", "block")
    }
    
    function fpMousemove(selectedData) {
        
        focusPoint
                .attr("cx", xScale(selectedData.date))
                .attr("cy", yScale(selectedData.All))
        if (options) 
            focusPointSelected
                .attr("cx", xScale(selectedData.date))
                .attr("cy", yScale(selectedData[options[1]]))
    }

    function fpMouseout() {
        focusPoint.style("display", "none")
        if (options) focusPointSelected.style("display", "none")
    }
