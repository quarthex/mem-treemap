import * as d3 from 'd3'
import { ipcRenderer } from 'electron'

const svg = document.querySelector('svg')

const treemap = d3.treemap()
  .tile(d3.treemapSquarify.ratio(1))
  .size([svg.clientWidth, svg.clientHeight])
  .padding(4)
  .round(true)

const color = d3.scaleOrdinal(d3.schemeCategory10)

const data = {
  name: 'memmap',
  children: []
}

function update () {
  const root = d3.hierarchy(data)
    .sum(d => d.mem)
    .sort((a, b) => b.data.mem - a.data.mem)

  treemap(root)

  const cell = d3.select('svg')
    .selectAll('g')
    .data(root.leaves())

  // enter
  const enter = cell.enter()
    .append('g')
  enter.append('rect')
  enter.append('clipPath').append('use')
  enter.append('text')
    .attr('x', 4)
    .attr('y', 17)
  enter.append('title')

  // exit
  cell.exit().remove()

  // update
  const update = cell.transition()
    .duration(1000)
    .attr('transform', d => `translate(${d.x0}, ${d.y0})`)

  update.select('rect')
    .attr('id', d => 'rect-' + d.data.pid)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => color(d.data.pid))

  update.select('clipPath')
    .attr('id', d => 'clip-' + d.data.pid)
    .select('use')
    .attr('xlink:href', d => '#rect-' + d.data.pid)

  update.select('text')
    .text(d => d.data.command ? d.data.command.split(' ')[0].split('/').pop() : '')
    .attr('clip-path', d => `url(#clip-${d.data.pid})`)

  update.select('title')
    .text(d => d.data.pid ? `[${d.data.pid}] ${d.data.command}` : '')
}

window.addEventListener('resize', () => {
  treemap.size([svg.clientWidth, svg.clientHeight])
  update()
})

ipcRenderer.on('data', (_, map, total) => {
  data.children = map
  if (total) data.mem = total
  update()
})
