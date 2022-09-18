#!/usr/bin/env node
import * as packageJson from '../package.json' assert { type: 'json' };
import {program} from 'commander'
import {change, list, init, initializeTemplates, updateTemplates} from "../commands.js";

program.usage('<command>')
program.version(packageJson.version)
program.hook('preAction',(thisCommand, actionCommand)=>{
	initializeTemplates()
})
program
.command('add')
.description('Add a new template')
.action(() => {change('add')})

program
.command('edit')
.description('Edit a template')
.action(() => {change('edit')})

program
.command('delete')
.description('Delete a template')
.action(() => {change('delete')})

program
.command('list')
.description('List the templateList')
.action(() => {list()})

program
.command('init')
.description('Init or embed a project')
.action(() => {init()})

program
.command('update')
.description('Update the internal templates.json')
.action(() => {updateTemplates()})

program.parse(process.argv)
