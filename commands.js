import fs from "fs";
import PATH from "path";
import chalk from "chalk";
import Table from "cli-table";
import download from 'download-git-repo'
import ora from "ora";
import inquirer from "inquirer";
import logSymbols from "log-symbols";
import templateList from "./templates.json" assert { type: 'json' }

export function change(type){
	const questions=[{
		name: 'name',
		type: 'input',
		message: `Please specify the name of the template to ${type}`,
		validate(val) {
			if (!val) {
				return 'Name is required!'
			}
			else if (type==='add' && val in templateList) {
				return `Template already exists!`
			}
			else if(type!=='add' && !(val in templateList)){
				return `Template does not exist!`
			}
			else {
				return true
			}
		}
	}]
	if(['add','edit'].includes(type)){
		questions.push({
			name: 'description',
			type: 'input',
			message: 'Provide an optional description',
			default:(answers)=>{
				return templateList[answers.name]?.description ?? 'None'
			}
		},{
			name: 'url',
			type: 'input',
			message: 'Please enter the template download URL',
			default:(answers)=>{
				return templateList[answers.name]?.url
			},
			validate(val) {
				if (val === '') return 'The URL is required!'
				return true
			}
		})
	}

	inquirer.prompt(questions).then(answers=>{
		let {name,url,description} = answers
		if(type==='delete'){
			delete templateList[name]
		}
		else {
			templateList[name] = {
				url:sanitize(url),
				description:sanitize(description)
			}
		}
		console.log(type,answers,templateList);
		fs.writeFile(`templates.json`, JSON.stringify(templateList), 'utf-8', (err) => {
			if (err) console.log(chalk.red(logSymbols.error), chalk.red(err))
			console.log('\n')
			console.log(chalk.green(logSymbols.success), chalk.green('Template added successfully!\n'))
			console.log(chalk.green('The latest templateList is: \n'))
			showTable(templateList)
		})
	})
}

export function list(){showTable(templateList)}

export function init(){
	const currentDir=process.cwd()
	const questions=[{
		name:'directory',
		type:'input',
		message:'Please enter a directory to save the project (strings starting without a / will be treated as relative to the current directory)',
		default:currentDir
	},{
		name:'templates',
		type:'checkbox',
		message:'Please choose the features to add to the project',
		choices:()=>Object.keys(templateList).map((key,i)=>({name:key,checked:i===0})),validate(val) {
			if (val.length===0) return 'At least one template is required'
			return true
		}
	}]

	inquirer.prompt(questions).then(answers=>{
		const {directory,templates}=answers
		templates.forEach(name=>{
			const isAbsolutePath=PATH.isAbsolute(directory)
			const path=isAbsolutePath ? directory : PATH.join(currentDir,directory)
			const url=templateList[name].url
			console.log(chalk.green('\n Start generating... \n'))
			const spinner = ora('Downloading...')
			spinner.start()

			download(`direct:${url}`, path, {clone: true}, (err) => {
				console.log();
				if (err && err.message!==`'git checkout' failed with status 1`) {
					spinner.fail()
					console.log(chalk.red(logSymbols.error), chalk.red(`Generation failed. ${err}`))
					return
				}
				spinner.succeed()
				console.log(chalk.green(logSymbols.success), chalk.green('Generation completed!'))
				console.log('\n To get started')
				console.log(`\n    1. cd ${directory}`)
				console.log(`    2. (p)npm i to install all dependencies \n`)
			})
		})
	})
}
const table = new Table({
	head: ['name','description','url'],
	style: {
		head: ['green']
	}
})
function showTable(){
	const list = Object.keys(templateList)
	if (list.length === 0) {
		console.log(table.toString())
		process.exit()
	}
	else {
		list.forEach((key) => {
			const {url,description}=templateList[key]
			table.push([key,description,url])
			if (table.length === list.length) {
				console.log(table.toString())
				process.exit()
			}
		})
	}
}
function sanitize(str){
	return str.replaceAll(/ [\u0000-\u0019] /g, '')
}
