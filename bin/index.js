#! /usr/bin/env node
// install dependencies
const fs = require("fs");
const inquirer = require("inquirer");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

const nebulaConfigPath = path.join(process.cwd(), "./nebula.conf.json");
const chivePackagesPath = path.join(process.cwd(), "./chive_packages/");
const includeFilePath = path.join(process.cwd(), "./include.ch");
const apiHost = "localhost:3000/";

// get command that is being triggered
var args = process.argv.slice(2);
args = ["nebula", ...args];
var COM = args.join(" ");
function com(amount) {
  return args.slice(0, amount).join(" ");
}

// execute commands (COM is the full command and com(*amount) selects the first *amount arguments/words)
if (COM.toLowerCase() == "nebula") {
  help();
} else if (COM.toLowerCase() == "nebula help") {
  help();
} else if (COM.toLowerCase() == "nebula init") {
  promptAndCreateConfig();
} else if (COM.toLowerCase() == "nebula init auto") {
  autoCreateConfig();
} else if (com(2).toLowerCase() == "nebula install") {
  var packageName = args.slice(2).join(" ");
  installPackage(packageName);
} else if (com(2).toLowerCase() == "nebula uninstall") {
  var packageName = args.slice(2).join(" ");
  uninstallPackage(packageName);
} else if (com(2).toLowerCase() == "nebula i") {
  var packageName = args.slice(2).join(" ");
  installPackage(packageName);
} else if (com(2).toLowerCase() == "nebula ui") {
  var packageName = args.slice(2).join(" ");
  uninstallPackage(packageName);
} else if (com(2).toLowerCase() == "nebula run") {
  var scriptName = args.slice(2).join(" ");
  runConfigScript(scriptName);
} else if (COM.toLowerCase() == "nebula publish") {
  // NEEDS TO BE DONE LATER ON
  console.log("publishing this package");
} else {
  console.log(
    `${COM} is not a valid command.\nrun 'nebula' or 'nebula help' for help`
  );
}

/*
list of commands I want to implement

nebula
nebula help

nebula init
nebula init auto

nebula install aPackage
nebula uninstall aPackage

nebula i aPackage
nebula ui aPackage

nebula run scriptName

(nebula claim) will be used inside nebula publish and claims a title
nebula publish
*/

function apiRoute(apiPath) {
  return "http://"+path.join(apiHost, apiPath);
}
function localPackage(packageName){
  return path.join(chivePackagesPath, packageName);
}

var SUCCESS = 1,
  FAIL = 0;

function setNebulaConfig(jsonData) {
  try {
    fs.writeFileSync(nebulaConfigPath, JSON.stringify(jsonData, null, 2));
    return 1; // means success
  } catch (error) {
    console.log("error: failed to write to nebula.conf.json");
    return 0; // means failure
  }
}
function getNebulaConfig() {
  return (
    JSON.parse(fs.readFileSync(nebulaConfigPath, "utf8")) || {
      name: "my package",
      author: "nebula cli",
      description: "A very good package!",
      packages: [],
      includes: [],
      scripts: {},
    }
  );
}

function help() {
  console.log("help needs to be done later");
}

function autoCreateConfig() {
  var status = setNebulaConfig({
    name: "my package",
    author: "nebula cli",
    description: "A very good package!",
    packages: [],
    includes: [],
    scripts: {},
  });
  if (status == SUCCESS) {
    console.log("default init sucess");
  }
}

function promptAndCreateConfig() {
  inquirer
    .prompt([
      {
        name: "name",
        message: "What is the name for you package?",
      },
      {
        name: "description",
        message: "Can you give a description of what this package does?",
      },
      {
        name: "author",
        message: "Who is the author of this package?",
      },
      {
        name: "entrypoint",
        message: "What is the main file / entrypoint of your package?",
        default: "main.ch",
      },
    ])
    .then((answers) => {
      // generate config data
      var configData = {};
      configData.name = answers.name;
      configData.description = answers.description;
      configData.author = answers.author;
      configData.main = answers.entrypoint;
      configData.packages = [];
      configData.includes = [];
      configData.scripts = {};

      var status = setNebulaConfig(configData);
      if (status == SUCCESS) {
        console.log("nebula.conf.json file created");
      }
    });
}

function installPackage(packageName) {
  var currentData = getNebulaConfig();
  if(currentData.packages.includes(packageName)){ // the package is installed
    console.log(`${packageName} is already installed`);
  }else{
    axios
      .get(apiRoute("packages/" + packageName))
      .then((res) => {
        if (res.status >= 200 && res.status < 300) {
          // create the package inside the chive_packages folder
          if (fs.existsSync(chivePackagesPath)) {
            fs.writeFileSync(
              localPackage(packageName + ".ch"),
              res.data
            );
          } else {
            fs.mkdirSync(chivePackagesPath);
            fs.writeFileSync(
              path.join(localPackage(packageName + ".ch")),
              res.data
            );
          }
          console.log("package is succesfully installed");

          // add the package to the nebula.conf.json file
          currentData.packages.push(packageName);
          setNebulaConfig(currentData);
          console.log(packageName + " added to nebula.conf.json");

          // add the package inside the include.ch file
          if (fs.existsSync(includeFilePath)) {
            var currentInclude = fs.readFileSync(
              includeFilePath,
              "utf8"
            );
            fs.writeFileSync(
              includeFilePath,
              currentInclude + "\n" + "./chive_packages/"+packageName + ".ch"
            );
            console.log(packageName + "added to include.ch");
          }
        } else {
          console.log("Error: server send a " + res.status + " status code");
        }
      })
      .catch((error) => {
        console.log("An error accored during the fetching of the package");
        console.log(error);
      });
  }
}

function uninstallPackage(packageName) {
  var currentData = getNebulaConfig();
  currentData.packages = currentData.packages.filter((el) => el != packageName);
  setNebulaConfig(currentData);
  console.log(packageName + " removed from nebula.conf.json");

  fs.unlinkSync(
    localPackage(packageName + ".ch")
  );

  if(fs.existsSync(includeFilePath)){
    var currentIncludeData = fs.readFileSync(includeFilePath, 'utf8').replaceAll('\r', '').split('\n');
    currentIncludeData = currentIncludeData.filter(item => item != "./chive_packages/"+packageName+".ch");
    fs.writeFileSync(includeFilePath, currentIncludeData.join('\n'));
    console.log(`${packageName} removed from include.ch file`);
  }

  console.log("package succesfully uninstalled");
}

function runConfigScript(scriptName) {
  var configData = getNebulaConfig();
  console.log("running script " + scriptName);
  // runs the script using the child_process module
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
}
