'use strict'

const metric = {
  id: 1,
  type: 'cpu',
  value: '20',
  agentId: 1,
  uuid: 'yyy-yyy-yyy',
  createdAt: new Date(),
  updatedAt: new Date()
}

const metrics = [
  metric,
  extend(metric, { id: 2, type: 21}),
  extend(metric, { id: 3, type: 15}),
  extend(metric, { id: 4, type: 10})
]

function extend (obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

module.exports = {
  single: metric,
  all: metrics,
  byUuid: id => metrics.filter(a => a.uuid === id),
  byId: id => metrics.filter(a => a.id === id).shift(),
  byTypeAgent: (type, id) => metrics.filter(a => a.type === type && a.uuid === id)
}