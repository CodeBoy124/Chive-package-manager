#! /usr/bin/env node
const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');
const axios = require('axios');
const { exec } = require("child_process");

var args = process.argv.slice(2);

args = ["nebula", ...args];

var COM = args.join(' ');

function com(amount){
    return args.slice(0, amount).join(' ');
}

if(COM.toLowerCase() == "nebula"){
    console.log("just nebula");
}else if(COM.toLowerCase() == "nebula help"){
    console.log("help");
}else if(COM.toLowerCase() == "nebula init"){
    var data = {};
    inquirer
        .prompt([
            {
                name: 'name',
                message: 'What is the name for you package?'
            },
            {
                name: 'description',
                message: 'Can you give a description of what this package does?'
            },
            {
                name: 'author',
                message: 'Who is the author of this package?'
            },
            {
                name: 'entrypoint',
                message: 'What is the main file / entrypoint of your package?',
                default: 'main.ch'
            }
        ])
        .then(answers => {
            data.name = answers.name;
            data.description = answers.description;
            data.author = answers.author;
            data.main = answers.entrypoint;
            data.packages = [];
            data.includes = [];
            data.scripts = {};
            fs.writeFileSync(path.join(process.cwd(),"nebula.conf.json"), JSON.stringify(data, null, 2));
            console.log("nebula.conf.json file created");
        });
    fs.writeFileSync("nebula.conf.json", JSON.stringify(data));
}else if(COM.toLowerCase() == "nebula init auto"){
    fs.writeFileSync("nebula.conf.json", JSON.stringify({
        name: "my package",
        author: "nebula cli",
        description: "A very good package!",
        packages: [],
        includes: [],
        scripts: {}
    }, null, 2));
    console.log("default init sucess");
}else if(com(2).toLowerCase() == "nebula install"){
    axios
        .get('http://localhost:3000/packages/'+packageName)
        .then(res => {
            if(res.status >= 200 && res.status < 300){
                if(fs.existsSync(path.join(process.cwd(), "./chive_packages/"))){
                    fs.writeFileSync(path.join(process.cwd(), "./chive_packages/"+packageName+".ch"), res.data);
                }else{
                    fs.mkdirSync(path.join(process.cwd(), "./chive_packages/"));
                    fs.writeFileSync(path.join(process.cwd(), "./chive_packages/"+packageName+".ch"), res.data);
                }
                console.log("package is succesfully installed");
                var packageName = args.slice(2).join(' ');

                var currentData = JSON.parse(fs.readFileSync("nebula.conf.json", 'utf8'));
                currentData.packages.push(packageName);
                fs.writeFileSync("nebula.conf.json", JSON.stringify(currentData, null, 2));
                console.log(packageName+" added to nebula.conf.json");

                if(fs.existsSync(path.join(process.cwd(), "./include.ch"))){
                    var currentInclude = fs.readFileSync(path.join(process.cwd(), "./include.ch"), 'utf8');
                    fs.writeFileSync(path.join(process.cwd(), "./include.ch"), currentInclude+"\n"+packageName+".ch");
                    console.log(packageName+"added to include.ch");
                }
            }else{
                console.log("Error: server send a "+res.status+" status code");
            }
        })
        .catch(error => {
            console.error(error)
        });
}else if(com(2).toLowerCase() == "nebula uninstall"){
    var packageName = args.slice(2).join(' ');
    var currentData = JSON.parse(fs.readFileSync("nebula.conf.json", 'utf8'));
    currentData.packages = currentData.packages.filter( el => el != packageName);
    fs.writeFileSync("nebula.conf.json", JSON.stringify(currentData, null, 2));
    console.log(packageName+" removed from nebula.conf.json");

    fs.unlinkSync(path.join(process.cwd(), "./chive_packages/"+packageName+".ch"));
    console.log("package succesfully uninstalled");
}else if(com(2).toLowerCase() == "nebula i"){
    axios
        .get('http://localhost:3000/packages/'+packageName)
        .then(res => {
            if(res.status >= 200 && res.status < 300){
                if(fs.existsSync(path.join(process.cwd(), "./chive_packages/"))){
                    fs.writeFileSync(path.join(process.cwd(), "./chive_packages/"+packageName+".ch"), res.data);
                }else{
                    fs.mkdirSync(path.join(process.cwd(), "./chive_packages/"));
                    fs.writeFileSync(path.join(process.cwd(), "./chive_packages/"+packageName+".ch"), res.data);
                }
                console.log("package is succesfully installed");
                var packageName = args.slice(2).join(' ');
                
                var currentData = JSON.parse(fs.readFileSync("nebula.conf.json", 'utf8'));
                currentData.packages.push(packageName);
                fs.writeFileSync("nebula.conf.json", JSON.stringify(currentData, null, 2));
                console.log(packageName+" added to nebula.conf.json");

                if(fs.existsSync(path.join(process.cwd(), "./include.ch"))){
                    var currentInclude = fs.readFileSync(path.join(process.cwd(), "./include.ch"), 'utf8');
                    fs.writeFileSync(path.join(process.cwd(), "./include.ch"), currentInclude+"\n"+packageName+".ch");
                    console.log(packageName+"added to include.ch");
                }
            }else{
                console.log("Error: server send a "+res.status+" status code");
            }
        })
        .catch(error => {
            console.error(error)
        });
}else if(com(2).toLowerCase() == "nebula ui"){
    var packageName = args.slice(2).join(' ');
    var currentData = JSON.parse(fs.readFileSync("nebula.conf.json", 'utf8'));
    currentData.packages = currentData.packages.filter( el => el != packageName);
    fs.writeFileSync("nebula.conf.json", JSON.stringify(currentData, null, 2));
    console.log(packageName+" removed from nebula.conf.json");

    fs.unlinkSync(path.join(process.cwd(), "./chive_packages/"+packageName+".ch"));
    console.log("package succesfully uninstalled");
}else if(com(2).toLowerCase() == "nebula run"){
    var scriptName = args.slice(2).join(' ');
    var configData = JSON.parse(fs.readFileSync("nebula.conf.json", 'utf8'));
    console.log("running script "+args.slice(2).join(' '));
    exec(configData.scripts[scriptName], (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(stdout);
    });
}else if(com(2).toLowerCase() == "nebula login"){
    console.log("loging in for "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "nebula logout"){
    console.log("logout for "+args.slice(2).join(' '));
}else if(COM.toLowerCase() == "nebula publish"){
    console.log("publishing this package");
}else{
    console.log("not a valid command");
}

/*
nebula
nebula help

nebula init
nebula init auto

nebula install aPackage
nebula uninstall aPackage

nebula i aPackage
nebula ui aPackage

nebula run scriptName

nebula login UserName
nebula logout

nebula publish
*/