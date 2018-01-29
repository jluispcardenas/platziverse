'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')

let config = {
  logging: function (s) { console.error(s)}
}
let MetricStub = {
  belongsTo: sinon.spy()
}

let id = 1
let uuid = 'yyy-yyy-yyy'
let AgentStub = null
let db = null
let sandbox = null
let type = 'cpu'

let single = Object.assign({}, agentFixtures.single)
let singleMetric = Object.assign({toJSON: function() { return singleMetric }}, metricFixtures.single)

let uuidArgs = {
  where: {
    uuid
  }
}
let findAllArgs = null
let findAllArgs2 = null

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()

  AgentStub = {
    hasMany: sandbox.spy()
  }
  
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(singleMetric).returns(Promise.resolve(singleMetric))
  
  findAllArgs = {
    attributes: ['type'],
    group: ['type'],
    include: [{
      attributes: [],
      model: AgentStub,
      where: {
        uuid
      }
    }],
    raw: true}
  
  findAllArgs2 = {
    attributes: ['id', 'type', 'value', 'createdAt'],
    where: {
      type
    },
    limit: 20,
    order: [['createdAt', 'DESC']],
    include: [{
      attributes: [],
      model: AgentStub,
      where: {
        uuid
      }
    }]
  }

  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs(findAllArgs).returns(Promise.resolve(metricFixtures.byUuid(uuid)))
  MetricStub.findAll.withArgs(findAllArgs2).returns(Promise.resolve(metricFixtures.byTypeAgent(type, uuid)))

 
  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})
test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById should be called with specified id')
  t.deepEqual(agent, agentFixtures.byId(id), 'should be the same')
})

test.serial('Agent#createOrUpdate', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findOne should be called with uuid args')
  t.true(AgentStub.update.called, 'agent.update called on model')
  t.true(AgentStub.update.calledOnce, 'agent.update should be called once')
  t.true(AgentStub.update.calledWith(single), 'agent.update should be called with specified args')

  t.deepEqual(agent, single, 'Agent should be the same')
})

test.serial('Metric#create', async t => {
  let metric = await db.Metric.create(uuid, singleMetric)
  
  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(MetricStub.create.calledWith(singleMetric), 'created should be called with specified uuid / metric')
 
  t.deepEqual(metric, singleMetric, 'should be the same')
})

test.serial('Metric#findByAgentId', async t => {
  let metrics = await db.Metric.findByAgentUuid(uuid)

  t.true(MetricStub.findAll.called, 'findAll should be called')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricStub.findAll.calledWith(findAllArgs), 'findall must be called with specified findAllArgs')

  t.deepEqual(metrics, metricFixtures.byUuid(uuid), 'should be the same')
})

test.serial('Metric#findByTypeAgent', async t => {
  let metrics = await db.Metric.findByTypeAgent(type, uuid)

  t.true(MetricStub.findAll.called, 'findAll should be called')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricStub.findAll.calledWith(findAllArgs2), 'findall must be called with specified findAllArgs2')

  t.deepEqual(metrics, metricFixtures.byTypeAgent(type, uuid), 'should be the same')
})