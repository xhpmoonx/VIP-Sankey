<template>
  <div ref="chartContainer" style="width: 100%; height: 600px;"></div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import * as d3 from 'd3'
import sankeyChart from '../sankey.js'

const chartContainer = ref(null)

function transformCurriculumToSankey(courses) {
  // Step 1: Build core node and link data
  const nodes = courses.map(course => ({
    key: course.id,
    name: course.label,
    code: course.id,
    term: course.term,
    type: course.type
  }))

  const links = []
  courses.forEach(course => {
    course.prereqs.forEach(prereq => {
      links.push({
        source: prereq,
        target: course.id,
        value: 1
      })
    })
  })

  // Step 2: Determine unique terms
  const terms = [...new Set(courses.map(c => c.term))].sort((a, b) => a - b)
  const columns = terms.map(term => ({
    name: `Term ${term}`,
    code: `term${term}`
  }))

  // Step 3: Detect terminal nodes (nodes that are NOT sources)
  const sourceIDs = new Set(links.map(link => link.source))
  const terminalNodes = nodes.filter(node => !sourceIDs.has(node.key))

  // Step 4: Add dummy "End" node
  const dummyNode = {
    key: '__end__',
    name: '',
    code: '__end__',
    term: Math.max(...terms) + 1,
    type: 'end'
  }
  nodes.push(dummyNode)

  // Step 5: Link terminal nodes to dummy node
  terminalNodes.forEach(node => {
    links.push({
      source: node.key,
      target: '__end__',
      value: 0.1 // invisible, just for layout balancing
    })
  })

  // Step 6: Add a dummy column for "End"
  columns.push({
    name: 'End',
    code: 'termX'
  })

  return {
    columns,
    nodes,
    links,
    rows: courses
  }
}


onMounted(async () => {
  const res = await fetch('/curriculum.json')
  const rawData = await res.json()
  const chartData = transformCurriculumToSankey(rawData)

  // Debug log to check node props
  console.log('Chart Nodes Sample:', chartData.nodes.slice(0, 5))

  const chart = sankeyChart()

  chart
    .nodeTooltipHTML(d => {
      const course = chartData.rows.find(r => r.id === d.key)
      return `<strong>${course.label}</strong><br/>${course.units} units`
    })
    .linkTooltipHTML(d => {
      return `From <strong>${d.source.name}</strong> to <strong>${d.target.name}</strong>`
    })
    .nodeColor(d => {
      console.log('Node color check:', d.key, d.type)
      const colors = {
        core: '#4CAF50',
        ge: '#2196F3',
        capstone: '#FFC107',
        elective: '#9C27B0'
      }
      return colors[d.type] || '#999'
    })

  const selection = d3.select(chartContainer.value)
  selection.datum(chartData).call(chart)
})
</script>

<style scoped>
.sankey-node text {
  font-size: 10px;
  fill: #000;
}

.sankey-link {
  fill: none;
  stroke-opacity: 0.4;
}

.sankey-header {
  font-weight: bold;
  font-size: 12px;
  fill: #333;
}
</style>
