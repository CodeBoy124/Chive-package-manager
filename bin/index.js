#! /usr/bin/env node
var args = process.argv.slice(2);

console.log(process.argv[1]);

args = ["cpm", ...args];

var COM = args.join(' ');

function com(amount){
    return args.slice(0, amount).join(' ');
}

if(COM.toLowerCase() == "cpm"){
    console.log("just cpm");
}else if(COM.toLowerCase() == "cpm help"){
    console.log("help");
}else if(COM.toLowerCase() == "cpm init"){
    console.log("just init");
}else if(COM.toLowerCase() == "cpm init auto"){
    console.log("default init");
}else if(com(2).toLowerCase() == "cpm install"){
    console.log("installing "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "cpm uninstall"){
    console.log("uninstalling "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "cpm i"){
    console.log("installing "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "cpm ui"){
    console.log("uninstalling "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "cpm run"){
    console.log("running script "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "cpm login"){
    console.log("loging in for "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "cpm logout"){
    console.log("logout for "+args.slice(2).join(' '));
}else if(COM.toLowerCase() == "cpm publish"){
    console.log("publishing this package");
}else{
    console.log("not a valid command");
}

/*
cpm
cpm help

cpm init
cpm init auto

cpm install aPackage
cpm uninstall aPackage

cpm i aPackage
cpm ui aPackage

cpm run scriptName

cpm login UserName
cpm logout

cpm publish
*/