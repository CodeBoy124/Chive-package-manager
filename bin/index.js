#! /usr/bin/env node
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
    console.log("just init");
}else if(COM.toLowerCase() == "nebula init auto"){
    console.log("default init");
}else if(com(2).toLowerCase() == "nebula install"){
    console.log("installing "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "nebula uninstall"){
    console.log("uninstalling "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "nebula i"){
    console.log("installing "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "nebula ui"){
    console.log("uninstalling "+args.slice(2).join(' '));
}else if(com(2).toLowerCase() == "nebula run"){
    console.log("running script "+args.slice(2).join(' '));
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