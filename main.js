let width = 1000,
    height = 600;

let svg = d3.select("svg").attr("viewBox", "0 0 " + width + " " + height);
Promise.all([
    d3.json("https://raw.githubusercontent.com/xumichaelxu/HASS-assignment4/main/sgmap.json"
    ),
    d3.csv(
        "https://raw.githubusercontent.com/xumichaelxu/HASS-assignment4/main/population2023.csv"
        ),
]).then((data) => {
    let mapData = data[0].features;
    let popData = data[1];

    // Merge pop data with map data
    mapData.forEach((d) => {
        let subzone = popData.find(
            (e) => e.Subzone.toUpperCase() == d.properties.Name
        );
        d.popdata = subzone != undefined ? parseInt(subzone.Population) : 0;
    });

    console.log(mapData);

    // Define brown color range
    let colorScale = d3
        .scaleThreshold()
        .domain([1, 20000, 40000, 60000, 80000, 100000, 120000])
        .range([
            "#d9b38c", // Light brown
            "#b68a5c",
            "#8f6141",
            "#74472e",
            "#5a3320",
            "#421f14",
            "#2c120b", // Dark brown
        ]);

    // Map and projection
    let projection = d3
        .geoMercator()
        .center([103.851959, 1.29027])
        .fitExtent(
            [
                [20, 20],
                [980, 580],
            ],
            data[0]
        );

    let geopath = d3.geoPath().projection(projection);

    // Compute the area for each zone
    mapData.forEach((d) => {
        d.area = d3.geoArea(d);
    });

    // Create a scaling function based on area
    const areaExtent = d3.extent(mapData, (d) => d.area);
    const minScale = 1.05;
    const maxScale = 2;
    const areaScale = d3
        .scaleLinear()
        .domain(areaExtent)
        .range([maxScale, minScale]);

    svg
        .append("g")
        .attr("id", "districts")
        .selectAll("path")
        .data(mapData)
        .enter()
        .append("path")
        .attr("d", geopath)
        .attr("stroke", "white")
        .attr("stroke-width", "0.25px")
        .attr("fill", (d) => colorScale(d.popdata))
        .classed("animated", true)
        // Event handlers
        .on("mouseover", (event, d) => {
            const centroid = geopath.centroid(d);
            const [x, y] = centroid;
            const scale = areaScale(d.area);

            d3.select(event.currentTarget)
                .classed("highlighted", true)
                .attr(
                    "transform",
                    `translate(${x * (1 - scale)}, ${
                        y * (1 - scale)
                    }) scale(${scale}, ${scale})`
                )
                .raise(); // Raise the hovered zone to the front

            d3.select(".tooltip")
                .html(
                    `<strong>${
                        d.properties.Name
                    }</strong><br>Population: ${d.popdata.toLocaleString()}`
                )
                .style("display", "block")
                .style("left", event.pageX + 60 + "px")
                .style("top", event.pageY - 60 + "px");
        })
        .on("mouseout", (event, d) => {
            d3.select(event.currentTarget)
                .classed("highlighted", false)
                .attr("transform", "translate(0, 0) scale(1, 1)");

            d3.select(".tooltip").style("display", "none");
        });

    // Create legend
    const legendSvg = d3
        .select("#legend")
        .attr("width", width)
        .attr("height", 80);

    const legendWidth = 300;
    const legendHeight = 20;
    const legendMargin = { top: 30, left: 100 };

    // Create a scale for the legend
    const legendX = d3
        .scaleLinear()
        .domain([0, 120000])
        .range([0, legendWidth]);

    // Create a group for the legend
    const legendG = legendSvg
        .append("g")
        .attr(
            "transform",
            `translate(${legendMargin.left}, ${legendMargin.top})`
        );

    // Add the color scale to the legend
    legendG
        .selectAll("rect")
        .data(colorScale.range())
        .enter()
        .append("rect")
        .attr("x", (d, i) => legendX(colorScale.domain()[i - 1]))
        .attr("y", 0)
        .attr(
            "width",
            (d, i) =>
                legendX(colorScale.domain()[i + 1]) -
                legendX(colorScale.domain()[i])
        )
        .attr("height", legendHeight)
        .attr("stroke", "#dad4c8")
        .attr("stroke-width", "0.5  px")
        .attr("fill", (d) => d);

    // Add legend labels
    const legendLabels = ["0", "20k", "40k", "60k", "80k", "100k"];
    const legendLabelY = legendMargin.top + legendHeight + 20;

    legendLabels.forEach((label, i) => {
        legendSvg
            .append("text")
            .attr("x", legendX(colorScale.domain()[i]) + legendMargin.left)
            .attr("y", legendLabelY)
            .attr("font-family", "Helvetica Neue")
            .attr("font-size", "10px")
            .attr("text-anchor", "middle")
            .attr("fill", "#dad4c8")
            .text(label);
    });
});
