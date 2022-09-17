const program = require('commander')

program.usage('<command>')

program.version(require('../package').version)

program
.command('add')
.description('add a new template')
.action(() => {
	require('../commands/add')
})

program
.command('delete')
.description('delete a template')
.action(() => {
	require('../commands/delete')
})

program
.command('list')
.description('List the templateList')
.action(() => {
	require('../commands/list')
})

program
.command('init')
.description('init a project')
.action(() => {
	require('../commands/init')
})

program.parse(process.argv)
