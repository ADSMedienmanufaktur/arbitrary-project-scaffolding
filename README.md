# CLI for arbitrary project scaffolding

This project allows you to scaffold an arbitrary project by allowing you to add, edit and delete templates before allowing you to choose what templates to add to a new project or embed into an existing one.

## Usage
After installing the cli either globally or locally you can call it with two commands: ```cli``` or ```aps``` (short for arbitrary project scaffolding)

## Commands
```
Usage: <cli|aps> <command>

Options:
-h, --help      display help for command

Commands:
add             Add a new template
edit            Edit a template
delete          Delete a template
list            List the templateList
init            Init or embed a project
update          Update the internal templates.json
help [command]  display help for command
```

## How it works
The CLI provides 4 basic commands to add, edit, update, delete and list templates from an internally maintained JSON file. Each template consists of an optional description and a repository url to pull it from. When running the init command you will be able to choose from the existing templates and where to clone them to.

## Templates
On first command execution a ```templates.json``` file will be created. This is used to store your individual project templates. Through the ```update``` command you can inject your own templates.json to be merged with the already added templates. The to be merged JSON file/files have to follow the structure: ```{[TEMPLATEKEY]:{url:...,description:...}}```. When provoding a directory as a path All *.json files will be merged into the Internal ```templates.json```.

## Notes
You might see an experimental warning when executing any CLI command. This can safely be ignored as it is due to NodeJS being used as aa ESM module (see [nodejs.org#import-assertions](https://nodejs.org/api/esm.html#import-assertions))
