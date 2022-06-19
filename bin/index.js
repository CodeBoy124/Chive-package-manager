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
const claimKeyPath = path.join(process.cwd(), "./claim.secret");
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
} else if(com(2).toLowerCase() == "nebula preview"){
  var packageName = args.slice(2).join(" ");
  previewPackage(packageName);
} else if (COM.toLowerCase() == "nebula publish") {
  // NEEDS TO BE DONE LATER ON
  publish();
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

nebula preview aPackage

(nebula claim) will be used inside nebula publish and claims a title. this will use the sha3-512 hashing algorithm on the server
nebula publish

```javascript
const crypto = require('crypto');
var hashedKey = crypto.createHash("sha3-512").update(SomeKey).digest("hex")
```


*/

function apiRoute(apiPath) {
  return "http://" + path.join(apiHost, apiPath);
}
function localPackage(packageName) {
  return path.join(chivePackagesPath, packageName);
}

var SUCCESS = 1,
  FAIL = 0;

function setNebulaConfig(jsonData) {
  try {
    fs.writeFileSync(nebulaConfigPath, JSON.stringify(jsonData, null, 2));
    return SUCCESS; // means success
  } catch (error) {
    console.log("error: failed to write to nebula.conf.json");
    return FAIL; // means failure
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

function setPackageKey(key) {
  try {
    fs.writeFileSync(claimKeyPath, key.toString());
    return SUCCESS;
  } catch (error) {
    return FAIL;
  }
}

function claim(name) {
  return new Promise((resolve, reject) => {
    axios
      .post(apiRoute("claimpackage/" + name))
      .then((res) => {
        if (res.status >= 200 && res.status < 300) {
          if (res.data == "-2") {
            console.log("Error: Server could not save the key");
            reject();
          } else if (res.data == "-1") {
            console.log("Error: Package is already claimed");
            reject();
          } else {
            var key = parseInt(res.data);
            console.log(`Success: The package name is claimed.`);

            var status = setPackageKey(key);
            if (status == SUCCESS) {
              console.log(
                "Package key stored in claim.secret\nDo not share the key with anyone who is not contributing\n"
              );
              resolve();
            } else {
              console.log(
                `Error: Package key could not be written to claim.secret.\nYou can manually create the claim.secret file and add the following text:\n${key}\nIf you were trying to publish a package you can then (after creating the claim.secret file) try to publish again using 'nebula publish'`
              );
              reject();
            }
          }
        }
      })
      .catch((err) => {
        reject();
      });
  });
}

function getPackageKey() {
  return fs.readFileSync(claimKeyPath, "utf8");
}

function sendPackagePostRequest(packageName, packageKey, fileName, fileContent){
  return axios.post(apiRoute(`editpackage/${packageName}`), {
    filename: fileName,
    filecontent: fileContent
  }, {
    headers: {
      packagekey: packageKey
    }
  });
}

function updateOnlinePackage(configData, key) {
  // send nebula.conf.json
  // axios.post(`http://localhost:3000/editpackage/${configData.name}`, {
  //   filename: "nebula.conf.json",
  //   filecontent: JSON.stringify(configData, null, 2)
  // },{
  //   headers: {
  //     packagekey: key
  //   }
  // })
  sendPackagePostRequest(configData.name, key, "nebula.conf.json", JSON.stringify(configData, null, 2))
    .then((r) => {
      if(r.data == "success"){
        console.log("nebula.conf.json - uploaded");
      }else if(r.data == "err:unauth"){
        console.log("nebula.conf.json - unauthorized request");
      }else if(r.data == "err:file"){
        console.log("nebula.conf.json - server file error");
      }
    })
    .catch(() => {});

  // send main code file
  sendPackagePostRequest(configData.name, key, configData.main, fs.readFileSync(path.join(process.cwd(), configData.main), 'utf8'))
    .then((r) => {
      if(r.data == "success"){
        console.log(configData.main+" - uploaded");
      }else if(r.data == "err:unauth"){
        console.log(configData.main+" - unauthorized request");
      }else if(r.data == "err:file"){
        console.log(configData.main+" - server file error");
      }
    })
    .catch(() => {});

  // send other local code files
  configData.includes.forEach(script => {
    sendPackagePostRequest(configData.name, key, script, fs.readFileSync(path.join(process.cwd(), script), 'utf8'))
      .then((r) => {
        if(r.data == "success"){
          console.log(script+" - uploaded");
        }else if(r.data == "err:unauth"){
          console.log(script+" - unauthorized request");
        }else if(r.data == "err:file"){
          console.log(script+" - server file error");
        }
      })
      .catch(() => {});
  });

  // send README.md if there is any
  if(fs.existsSync(path.join(process.cwd(), "./README.md"))){
    sendPackagePostRequest(configData.name, key, "README.md", fs.readFileSync(path.join(process.cwd(), "./README.md"), 'utf8'))
      .then((r) => {
        if(r.data == "success"){
          console.log("README.md - uploaded");
        }else if(r.data == "err:unauth"){
          console.log("README.md - unauthorized request");
        }else if(r.data == "err:file"){
          console.log("README.md - server file error");
        }
      })
      .catch(() => {});
  }
}

function publish() {
  var configData = getNebulaConfig();

  if (fs.existsSync(claimKeyPath)) {
    var key = getPackageKey();
    updateOnlinePackage(configData, key);
  } else {
    console.log("Trying to claim the package name...");
    claim(configData.name)
      .then(() => {
        var key = getPackageKey();
        updateOnlinePackage(configData, key);
      })
      .catch(() => {
        console.log("Error: Publish failed");
      });
  }
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
  if (currentData.packages.includes(packageName)) {
    // the package is installed
    console.log(`${packageName} is already installed`);
  } else {
    axios
      .get(apiRoute("packages/" + packageName))
      .then((res) => {
        if (res.status >= 200 && res.status < 300) {
          // create the package inside the chive_packages folder
          if (fs.existsSync(chivePackagesPath)) {
            fs.writeFileSync(localPackage(packageName + ".ch"), res.data);
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
            var currentInclude = fs.readFileSync(includeFilePath, "utf8");
            fs.writeFileSync(
              includeFilePath,
              currentInclude + "\n" + "./chive_packages/" + packageName + ".ch"
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

  fs.unlinkSync(localPackage(packageName + ".ch"));

  if (fs.existsSync(includeFilePath)) {
    var currentIncludeData = fs
      .readFileSync(includeFilePath, "utf8")
      .replaceAll("\r", "")
      .split("\n");
    currentIncludeData = currentIncludeData.filter(
      (item) => item != "./chive_packages/" + packageName + ".ch"
    );
    fs.writeFileSync(includeFilePath, currentIncludeData.join("\n"));
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

function previewPackage(name){
  axios.get(apiRoute("preview/"+name))
    .then((res) => {
      console.log(res.data); // might need to make a markdown terminal previewer later
    })
    .catch((err) => {
      //
    });
}