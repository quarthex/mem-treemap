import * as d3 from 'd3'
import { ipcRenderer } from 'electron'

const svg = document.querySelector('svg')

const treemap = d3.treemap()
  .tile(d3.treemapResquarify.ratio(1.618))
  .size([svg.clientWidth, svg.clientHeight])
  .paddingOuter(3)
  .paddingTop(19)
  .paddingInner(1)
  .round(true)

const color = d3.scaleOrdinal(d3.schemeCategory10)

const stratify = d3.stratify()
  .id(d => d.pid)
  .parentId(d => d.ppid)

function update (map, total) {
  const root = stratify(map)
    .sum(d => d.mem)
    .sort((a, b) => b.data.mem - a.data.mem)
  // fixup the root node so there's empty space corresponding to free memory.
  root.value = total

  treemap(root)

  const cell = d3.select('svg')
    .selectAll('g')
    .data(root.descendants())

  // enter
  const enter = cell.enter()
    .append('g')
    .attr('class', 'node')
    .on('mouseover', hovered(true))
    .on('mouseout', hovered(false))
  enter.append('rect')
  enter.append('clipPath').append('use')
  enter.append('text')
    .attr('x', 4)
    .attr('y', 13)
  enter.append('title')

  // exit
  cell.exit().remove()

  // update
  const update = cell.transition()
    .duration(1000)
    .each(function (d) { d.node = this })
    .attr('transform', d => `translate(${d.x0}, ${d.y0})`)

  update.select('rect')
    .attr('id', d => 'rect-' + d.data.pid)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    // colorize based on the name of the process
    .attr('fill', d => color(d.data.shortCommand))

  update.select('clipPath')
    .attr('id', d => 'clip-' + d.data.pid)
    .select('use')
    .attr('xlink:href', d => '#rect-' + d.data.pid)

  update.select('text')
    .text(d => d.data.shortCommand)
    .attr('clip-path', d => `url(#clip-${d.data.pid})`)

  update.select('title')
    .text(d => d.data.pid ? `[${d.data.pid} : ${d.data.ppid}] ${d.data.command}` : '')
}

function hovered (hover) {
  return d =>
    d3.selectAll(d.ancestors().map(d => d.node))
      .classed('node--hover', hover)
      .select('rect')
      .attr('width', d => d.x1 - d.x0 - hover)
      .attr('height', d => d.y1 - d.y0 - hover)
}

let lastMap, lastTotal
window.addEventListener('resize', () => {
  treemap.size([svg.clientWidth, svg.clientHeight])
  update(lastMap, lastTotal)
})

ipcRenderer.on('data', (_, map, total) => {
  // create a root node
  map.push({ pid: 1, ppid: undefined, mem: 0, command: 'memmap' })

  lastMap = map
  lastTotal = total
  update(map, total)
})
