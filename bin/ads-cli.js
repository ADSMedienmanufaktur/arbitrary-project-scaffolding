import * as packageJson from '../package.json' assert { type: 'json' };
import {program} from 'commander'
import {change,list,init} from "../commands.js";

program.usage('<command>')

program.version(packageJson.version)

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

program.parse(process.argv)
