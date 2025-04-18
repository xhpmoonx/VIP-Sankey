import * as d3 from 'd3';
import { sankey as sankeyGenerator, sankeyLinkHorizontal } from 'd3-sankey';

export default function () {
  const $$ = {
    padding: 15,
    nodeColor: d3.scaleOrdinal(d3.schemeCategory10),
    subFlowEnabled: false,
    linkTooltipHTML: null,
    nodeTooltipHTML: null,
    nodeClick: null,
    linkClick: null,
    layout: sankeyGenerator().nodePadding(10).nodeWidth(10),
  };

  function sankey(context) {
    const selection = context.selection ? context.selection() : context,
      datum = selection.datum(),
      box = selection.node().getBoundingClientRect(),
      path = sankeyLinkHorizontal(),
      headerPadding = 20;

    const width = box.width - $$.padding * 2,
      height = box.height - $$.padding * 2 - headerPadding;

    const nodeWidth = Math.min(10, width / 100);

    const headerScale = d3.scalePoint()
      .domain(datum.columns.map(d => d.name))
      .range([0, width - nodeWidth]);

    // ✅ Deep clone nodes to preserve custom props like `.type`
    const clonedNodes = datum.nodes.map(d => ({ ...d }));

    $$.layout
      .size([width, height])
      .nodeWidth(nodeWidth)
      .nodeId(d => d.key) // ensure identity is retained
      .nodes(clonedNodes) // must be set BEFORE .links()
      .links(datum.links)
      .iterations(0);

    const sankeyDatum = $$.layout();

    let svg = selection.selectAll('svg').data([sankeyDatum]),
      svgEnter = svg.enter().append('svg');
    svg = svg.merge(svgEnter);
    svg.selectAll('text:not(.node-label)').remove();


    let g = svg.selectAll('g.sankey-group').data([sankeyDatum]);
    g = g.merge(g.enter().append('g').attr('class', 'sankey-group'));

    svg
      .attr('width', box.width)
      .attr('height', box.height);

    g.attr('transform', `translate(${$$.padding}, ${$$.padding})`);

    // LINKS
    const links = g.selectAll('.sankey-link')
      .data(d => d.links, d => d.key);

    const linksEnter = links.enter()
      .append('path')
      .attr('class', 'sankey-link')
      .attr('d', path)
      .style('fill', 'none')
      .style('stroke', d => $$.nodeColor(d.source))
      .style('stroke-width', d => Math.max(0.1, d.width))
      .style('opacity', 0.5)
      .on('click', $$.linkClick)
      .append('title')
      .text(d => `${d.source.name} → ${d.target.name}: ${d.value}`);

    links.exit().remove();

    // NODES
    const nodes = g.selectAll('.sankey-node')
      .data(d => d.nodes, d => d.key);

    const nodeEnter = nodes.enter()
      .append('g')
      .attr('class', 'sankey-node')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
      .on('click', $$.nodeClick);

    nodeEnter.append('rect')
      .attr('height', d => d.y1 - d.y0)
      .attr('width', nodeWidth)
      .style('fill', d => $$.nodeColor(d)); 

      nodeEnter
      .filter(d => d.name) // ✅ Only nodes with names
      .append('text')
      .attr('x', nodeWidth + 6)
      .attr('y', d => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .style('pointer-events', 'none')
      .style('font-size', '10px')
      .style('fill', '#000')
      .text(d => d.name.trim());    
    

    nodes.exit().remove();
  }

  return Object.assign(sankey, {
    padding: (val) => { $$.padding = val; return sankey; },
    nodeColor: (val) => { $$.nodeColor = val; return sankey; },
    layout: (val) => { $$.layout = val; return sankey; },
    linkTooltipHTML: (val) => { $$.linkTooltipHTML = val; return sankey; },
    nodeTooltipHTML: (val) => { $$.nodeTooltipHTML = val; return sankey; },
    nodeClick: (val) => { $$.nodeClick = val; return sankey; },
    linkClick: (val) => { $$.linkClick = val; return sankey; },
    subFlowEnabled: (val) => { $$.subFlowEnabled = val; return sankey; },
  });
}
