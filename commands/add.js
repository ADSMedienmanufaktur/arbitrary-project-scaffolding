#!/usr/bin/env node
import fs from 'fs'
import inquirer from 'inquirer'
import chalk from 'chalk'
import logSymbols from 'log-symbols'
import templateList from '../templates.json'
import {showTable} from '../util/showTable'
chalk.level = 1

const question = [{
    name: 'name',
    type: 'input',
    Message: 'Please enter the template name',
    validate(val) {
      if (!val) {
        return 'Name is required!'
      } else if (templateList[val]) {
        return 'Template has already existed!'
      } else {
        return true
      }
    }
  },
  {
    name: 'url',
    type: 'input',
    Message: 'please enter the template address',
    validate(val) {
      if (val === '') return 'The url is required!'
      return true
    }
}]

inquirer.prompt(question).then((answers) => {
  let { name, url } = answers
  templateList[name] = url.replaceAll(/ [\u0000-\u0019] /g, '') // filter Unicode characters
  fs.writeFile(`${__dirname}/../template.json`, JSON.stringify(templateList), 'utf-8', (err) => {
    if (err) console.log(chalk.red(logSymbols.error), chalk.red(err))
    console.log('\n')
    console.log(chalk.green(logSymbols.success), chalk.green('Template added successfully!\n'))
    console.log(chalk.green('The latest templateList is: \n'))
    showTable(templateList)
  })
})
