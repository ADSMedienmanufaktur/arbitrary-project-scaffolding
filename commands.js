import fs from "fs";
import PATH from "path";
import chalk from "chalk";
import Table from "cli-table";
import download from 'download-git-repo'
import ora from "ora";
import inquirer from "inquirer";
import logSymbols from "log-symbols";
import axios from 'axios'

export function change(type){
	const templateList=getTemplates()
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
		fs.writeFile(`templates.json`, JSON.stringify(templateList), 'utf-8', (err) => {
			if (err) console.log(chalk.red(logSymbols.error), chalk.red(err))
			console.log('\n')
			console.log(chalk.green(logSymbols.success), chalk.green('Template added successfully!\n'))
			console.log(chalk.green('The latest templateList is: \n'))
			showTable(templateList)
		})
	})
}

export function list(){showTable(getTemplates())}

export function init(){
	const templateList=getTemplates()
	const questions=[{
		name:'directory',
		type:'input',
		message:'Please enter a base directory to save the template(s) (each template will be stored in a subdirectory)',
		default:process.cwd()
	},{
		name:'templates',
		type:'checkbox',
		message:'Please choose the features to add to the project',
		choices:()=>Object.keys(templateList).map((key,i)=>({name:key,checked:i===0})),validate(val) {
			if (val.length===0) return 'At least one template is required'
			return true
		}
	},/*{
		name:'clone',
		type:'list',
		message:({templates})=>{
			const isSingle=templates.length===1
			const template=`template${isSingle ? 's' : ''}`
			return `How Do you want to download the ${template}?`
		},
		choices:[{
			name:'GIT Clone',
			value:true
		},{
			name:'Download',
			value:false
		}]
	}*/]

	inquirer.prompt(questions).then(answers=>{
		const {directory,templates,clone=true}=answers
		templates.forEach(name=>{
			const {path}=checkFile(PATH.join(directory,name))
			const url=templateList[name].url
			const spinner = ora('Downloading...')
			console.log(chalk.green('\n Start generating... \n'))
			spinner.start()
			download(`direct:${url}`, path, {clone}, (err) => {
				if (err && err.message!==`'git checkout' failed with status 1`) {
					spinner.fail()
					console.log(chalk.red(logSymbols.error), chalk.red(`Generation failed. ${err}`))
					return
				}
				spinner.succeed()
				console.log(chalk.green(logSymbols.success), chalk.green('Generation completed!'))
				console.log('\n To get started')
				console.log(`\n    1. cd ${path}`)
				console.log(`    2. (p)npm i to install all dependencies \n`)
			})
		})
	})
}

export function updateTemplates(){
	const questions=[{
		name:'type',
		type:'list',
		message:'Please choose where to find your templates',
		choices:[{
			name:'Remotely via URL',
			value:'remote'
		},{
			name:'Locally in a file/directory',
			value:'local'
		}]
	},{
		name:'location',
		type:'input',
		message:({type})=>{
			if(type==='remote') return 'Please enter the URL to pull your templates from'
			else return 'Please enter the file path to your templates JSON file (paths starting without a / will be treated as relative tu the current working directory)'
		},
		validate(location, {type}) {
			if(location==='') return 'A location is required!'
			else if(type==='remote')
				return location.startsWith('http') ? true : 'URL must user either HTTP or HTTPS protocol!'
			else if(type==='local'){
				const {isValid}=checkFile(location)
				return isValid ? true : 'File mus be a valid JSON or a directory!'
			}
			return true
		}
	}]

	inquirer.prompt(questions).then(async answers=>{
		const {type,location,clone}=answers
		const spinner = ora('Downloading...')
		console.log(chalk.green('\n Starting to fetch... \n'))
		spinner.start()
		let template={}
		if(type==='local'){
			const {path,isDir}=checkFile(location)
			if(isDir){
				fs.readdirSync(path).forEach(fileName=>{
					if(PATH.extname(fileName)==='.json'){
						template={...template,...JSON.parse(fs.readFileSync(PATH.join(path,fileName)))}
					}
				})
			}
			else if(PATH.extname(path)==='.json'){
				template={...template,...JSON.parse(fs.readFileSync(path))}
			}
		}
		else{
			const data=(await axios.get(location)).data
			template={...template,...data}
		}
		fs.writeFile('./templates.json',JSON.stringify(template),'utf-8',(err)=>{
			if(err){
				spinner.fail()
				console.log(chalk.red(logSymbols.error), chalk.red(`Merge failed. ${err}`))
				return
			}
			spinner.succeed()
			console.log(chalk.green('\n Finished merging the templates! \n'))
			console.log(chalk.green('The new template list is:'))
			showTable()
		})
	})
}

export function initializeTemplates(){
	if(!fs.existsSync('./templates.json')){
		try {
			fs.writeFileSync(`templates.json`, "{}", 'utf-8')
			console.log(chalk.green('templates.json created successfully!'))
		}
		catch (err) {
			console.log(chalk.red(logSymbols.error), chalk.red(err))
			process.exit(1)

		}
	}
}

const table = new Table({
	head: ['name','description','url'],
	style: {
		head: ['green']
	}
})
function showTable(){
	const templateList=getTemplates()
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

function getTemplates(){
	initializeTemplates()
	return JSON.parse(fs.readFileSync('./templates.json','utf-8'))
}

function checkFile(directory){
	const isAbsolutePath=PATH.isAbsolute(directory)
	const path=isAbsolutePath ? directory : PATH.join(process.cwd(),directory)
	const isDir=fs.existsSync(path) && fs.lstatSync(path).isDirectory()
	console.log(PATH.extname(path));
	const isValid=isDir || PATH.extname(path)==='.json'
	return {path,isDir,isValid}
}
