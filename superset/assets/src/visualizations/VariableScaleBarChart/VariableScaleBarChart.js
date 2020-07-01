/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-disable react/sort-prop-types */

import d3 from 'd3';
import PropTypes from 'prop-types';
import './styles.css';
import { CategoricalColorNamespace } from '@superset-ui/color';

const propTypes = {
  // Standard tabular data [{ fieldName1: value1, fieldName2: value2 }]
  width: PropTypes.number,
  height: PropTypes.number,
  data: PropTypes.arrayOf(PropTypes.object),
  colorScheme: PropTypes.string,
  metrics: PropTypes.arrayOf(PropTypes.string),
  series: PropTypes.string,
  showLegend: PropTypes.bool,
  showBarValues: PropTypes.bool,
  sortBars: PropTypes.string,
  xAxisLabel: PropTypes.string,
  bottomMargin: PropTypes.number,
  xTicksLayout: PropTypes.string,
  barValuePrecision: PropTypes.number,
};

const TIME_SHIFT_PATTERN = /\d+ \w+ offset/;
const { getColor } = CategoricalColorNamespace;
function cleanColorInput(value) {
    // for superset series that should have the same color
    return String(value)
      .trim()
      .replace(' (right axis)', '')
      .split(', ')
      .filter(k => !TIME_SHIFT_PATTERN.test(k))
      .join(', ');
  }

function VariableScale(element,props){
    const{ 
        series,
        data,
        metrics,
        sortBars,
        xAxisLabel,
        bottomMargin,
        showLegend,
        showBarValues,
        colorScheme,
        xTicksLayout,
        barValueLayout,
        barValuePrecision
    } = props;

    let innerwidth = 0,
        innerheight = 0,
        singleAxisWidth = 40,
        axisWidth,
        graphWidth,
        entryWidth,
        barWidth,
        yScale,
        yAxis,
        entries = 0,
        rAngle,
        bAngle;

    let color = ["#e8a92c","#6e63c2","#f0ec1d","#950cad","#3bbad4","#38f2ff","#d1ce0d"];
    const colorScale = (d) => getColor(cleanColorInput(d), colorScheme);

    const el = d3.select(element).attr("id","my-svg"),
          svg = el.append("svg").attr("width","100%").attr("height","100%"),
          margin = { top: 100, bottom: bottomMargin === "auto" ? 100 : parseInt(bottomMargin), left:2, right:30 };

    let data1 = [];
    for(let i =0 ; i < data.length ; i++ ){
        data1.push(data[i]);
    }

    render();

    // functions
    function render(){
        svg.selectAll("g").remove();
        let GraphG = svg.append('g');
        
        if(sortBars === "auto"){
            data1 = data;
        }
        else if(sortBars === "ascending"){
            data1.sort(function(a,b){
                return (parseInt(a[metrics[0]]) - parseInt(b[metrics[0]]) );
            });
        }
        else if(sortBars === "descending"){
            data1.sort(function(a,b){
                return (parseInt(b[metrics[0]]) - parseInt(a[metrics[0]]) );
            });
        }

        if(xTicksLayout === "auto" || xTicksLayout === "flat" || xTicksLayout === "staggered"){
            rAngle = 0;
        }
        else if(xTicksLayout === "45°"){
            rAngle = 45;
        }

        if(barValueLayout === "0°"){
            bAngle = 0;
        }
        else if(barValueLayout === "45°"){
            bAngle = -45;
        }
        else if(barValueLayout === "90°"){
            bAngle = -90;
        }

        innerheight = parseInt(svg.style('height')) - margin.top - margin.bottom;
        innerwidth = parseInt(svg.style('width')) - margin.left - margin.right;
        entries = data1.length;

        axisWidth = singleAxisWidth * metrics.length + 26;
        graphWidth = innerwidth - axisWidth;
        entryWidth = graphWidth/entries;
        barWidth = (entryWidth*8/9) / metrics.length;

        let LinearScale = [];
        let dMax = [];
        metrics.forEach((col) => {
            let val = d3.max( data1.map((d) => d[col]));
            let k = 0.001;
            while(k < val)
                k *= 10;
            if( k > 2*val)
                k /= 2;
            dMax.push(k);
        });

        // appending Axes
        for(let m = 0 ; m < metrics.length ; m++ ){
            yScale = d3.scale.linear().domain([0,dMax[m]]).range([innerheight,0]);
            LinearScale.push(yScale);
            yAxis = d3.svg.axis().scale(yScale).orient('left')
                          .tickPadding(4).ticks(10).tickSize(5)
                          .tickFormat(dMax[m] < 10 ? d3.format("") : d3.format(".2s") );
            let axisG = GraphG.append('g')
                            .classed('my-axis',true)
                            .attr('id',`axis${m}`);

            axisG.call(yAxis)
            .attr('transform',`translate(${margin.left + 12 + singleAxisWidth * (m+1)},${margin.top})`);
            axisG.select("path")
                .style("stroke",colorScale(metrics[m]) || color[m])
                .style("stroke-width",2.75)
                .style('fill','none');
            axisG.append('text')
            .text(`${metrics[m].toUpperCase()}`)
            .attr('fill','#777777')
            .attr('y','-37')
            .attr('transform',`rotate(-30,${margin.left + singleAxisWidth},${margin.top -150})`)
            .attr('text-anchor','start')
            .attr('x','-15')
            .attr('font-weight','800')
            .attr('font-size','10');
        }

        // The right axis for extending the ticks so that they remain same as the are
        yScale = d3.scale.linear().domain([0,10]).range([innerheight,0]);
        yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left')
                .tickPadding(5)
                .ticks(10)
                .tickSize(innerwidth-axisWidth + innerwidth/40 - 14);
        let axisG = GraphG.append('g')
                    .classed('right-axis',true)
                    .attr('id',`axis${-1}`);
        axisG.call(yAxis)
            .attr('transform',`translate(${innerwidth},${margin.top})`);
        axisG.select("path")
            .style("stroke","#00000024")
            .style("stroke-width",1)
            .style('fill','none');

        // Appending Bars
        d3.selectAll("rect").remove();  // befor re-rendering delete all existing Bars

        for(let j = 0 ; j < metrics.length ; j++ ){
            svg.append("g").selectAll("rect").data(data1).enter().append("rect")
            .style("fill", colorScale(metrics[j]) || color[j])
            .attr("x",(d,i) => axisWidth+(barWidth)*j+(entryWidth*i) )
            .attr("width",barWidth)
            .attr("y",(d) => margin.top + LinearScale[j](d[metrics[j]]) )
            .attr("height",(d) => innerheight - LinearScale[j](d[metrics[j]]));
        }

        d3.selectAll("rect").attr("id",(d,i) => `bar${i}`);
        d3.selectAll("rect")
        .on("mouseover",(d,i) => onMouseOver(i))
        .on("mouseout",(d,i) => onMouseOut(i));

        // Appending X Axes labels
        svg.append("g").selectAll("text").data(data1)
            .enter().append("text")
            .classed("x-label",true)
            .text((d,i) => d[series])
            .attr("y",(d,i) => innerheight + margin.top + 18 + ((xTicksLayout === "staggered") ? (i%2)*12 : 0 ))
            .attr("x",(d,i) => axisWidth + entryWidth*i + entryWidth*4/9)
            .style("fill","#555555")
            .attr("text-anchor",xTicksLayout === "45°" ? "start" : "middle")
            .attr("transform",(d,i) => `rotate(${rAngle},${axisWidth + entryWidth*i + entryWidth*4/9},${innerheight + margin.top})`);

        // Adding X axis label if true
        if(xAxisLabel !== ""){
            svg.append("g").append("text")
                .text(xAxisLabel)
                .attr("text-anchor","middle")
                .attr("transform", "translate(" + (innerwidth/2) + ", " + (margin.top+innerheight+60) + ")")
        }

        // Append the legend if true
        if(showLegend){
            let legend = svg.append("g").attr("id","legendG");
            let row = -1,col = 0;
            for(let j = 0 ; j < metrics.length ; j++,col++ ){
                if(j % 3 == 0){
                    row++;
                    col = 0;
                }
                legend.append("rect")
                    .style("fill",colorScale(metrics[j]) || color[j])
                    .attr("transform","translate("+(axisWidth + graphWidth/2.5 + 210*col)+","+(20 + 20*row)+")")
                    .attr("width",15)
                    .attr("height",10);
                legend.append("text")
                    .text(metrics[j])
                    .attr("transform","translate("+(axisWidth + graphWidth/2.5 + 210*col + 20)+","+(28 + 20*row)+")")
                    .style("fill","#000000")
                    .style("font-size","0.73rem");
            }
        }

        // show the bar values on top of each bar if true
        if(showBarValues){
            let vals = svg.append("g");
            let entry = -1, metricNum = 0;
            for(let j = 0 ; j < metrics.length*entries ; j++,metricNum++ ){
                if(j % (metrics.length) == 0 ){
                    metricNum = 0;
                    entry++;
                }
                vals.append("text")
                .text( d3.format(`0.${parseInt(barValuePrecision)}s`)(data1[entry][metrics[metricNum]]) )
                    .attr("id",`barValue${j}`)
                    .style("fill","#000000")
                    .style("font-size","0.62rem")
                    .style("font-weight","400")
                    .attr("text-anchor",barValueLayout === "0°" ? "middle" : "start")
                    .attr("y",margin.top + LinearScale[metricNum](data1[entry][metrics[metricNum]]) - 3)
                    .attr("x",axisWidth +entryWidth*entry + barWidth*metricNum + barWidth/2)
                    .attr("transform",`rotate(${bAngle},${axisWidth +entryWidth*entry + barWidth*metricNum + barWidth/2},${margin.top + LinearScale[metricNum](data1[entry][metrics[metricNum]]) - 3})`);
            }
        }
    }

    // Functions
    function onMouseOver(i){
        let mul = Math.floor(i/entries);
        let start = mul * entries;
        let max = start + entries;

        for(let k = 0 ; k < start ; k++ ){
            document.getElementById("bar"+k).style.opacity = 0.2;
        }

        for(let k = max ; k < entries*metrics.length ; k++ ){
            document.getElementById("bar"+k).style.opacity = 0.2;
        }

        document.getElementById(`axis${mul}`).style.opacity = 1;

        for(let k = 0 ; k < metrics.length ; k++){
            if( k !== mul)
            document.getElementById(`axis${k}`).style.opacity = 0.2;
        }

        // if bar values are diaplayed then change them also
        if(showBarValues){
            let entry = 0;
            for(let k = 0 ; k < metrics.length*entries ; k++){
                if( k == mul+ metrics.length*entry )   entry++;
                else  document.getElementById("barValue"+k).style.opacity = 0.2;
            }
        }
    }

    function onMouseOut(i){
        for(let k = 0 ; k < entries*metrics.length ; k++ ){
            document.getElementById("bar"+k).style.opacity = 1;
        }
        for(let k = 0 ; k < metrics.length ; k++)
            document.getElementById(`axis${k}`).style.opacity = 1;

        // if bar values are diaplayed then change them also
        if(showBarValues){
            for(let k = 0 ; k < entries*metrics.length ; k++ ){
                document.getElementById("barValue"+k).style.opacity = 1;
            }
        }
    }
}

VariableScale.displayName = 'Variable Scale BarChart';
VariableScale.propTypes = propTypes;

export default VariableScale;