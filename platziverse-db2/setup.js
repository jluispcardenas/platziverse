'use strict'

const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const db = require('./')
const prompt = inquirer.createPromptModule()

async function setup () {
  const answer = await prompt([
    {
      type: 'confirm',
      name: 'setup',
      message: 'This will destroy your database'
    }
  ])

  if (!answer.setup) {
    return console.log('Nothing happen! :)')
  }

  const config = {
    database: process.env.DB_NAME || 'platzi',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    //dialect: 'sqlite',
    //storage: "./db.test.sqlite",

    logging: s => debug(s),
    setup: true

  }

  await db(config).catch(handleFatalError)
}

function handleFatalError (err) {
  console.error(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

setup()
