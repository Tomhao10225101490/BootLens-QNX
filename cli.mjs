#!/usr/bin/env node
import {readFile,readdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import {analyze,sarif,compare} from './dist/analyzer.js';
const args=process.argv.slice(2);const help=`BootLens 1.0 — QNX SDP 8.0 mkifs preflight\n\nnode cli.mjs <image.build> [--format text|json|sarif] [--workspace DIR]\n                          [--baseline OLD.build] [--fail-on error|warning|never]\n\nIncludes are loaded from --workspace (default: input directory), never outside it.\nSupported-subset diagnostics only. No QNX toolchain or target execution.\nExit 0: below threshold; 1: findings meet threshold; 2: input/usage failure.\n`;
if(!args.length||args.includes('--help')){console.log(help);process.exit(0);}
let filename,format='text',workspace,baseline,fail='error';
try{
 for(let i=0;i<args.length;i++){const a=args[i];if(['--format','--workspace','--baseline','--fail-on'].includes(a)){const v=args[++i];if(!v||v.startsWith('--'))throw Error('Missing value for '+a);if(a==='--format')format=v;if(a==='--workspace')workspace=v;if(a==='--baseline')baseline=v;if(a==='--fail-on')fail=v;}else if(a.startsWith('-')||filename)throw Error('Unexpected argument: '+a);else filename=a;}
 if(!['text','json','sarif'].includes(format)||!['error','warning','never'].includes(fail))throw Error('Invalid format or fail-on value.');
 const absolute=await realpath(filename),root=await realpath(workspace||path.dirname(absolute));
 if(absolute!==root&&!absolute.startsWith(root+path.sep))throw Error('Input is outside the workspace.');
 const files={};let bytes=0;
 async function collect(dir,depth=0){if(depth>20)throw Error('Workspace nesting exceeds 20 levels.');for(const e of await readdir(dir,{withFileTypes:true})){if(['.git','node_modules','.venv'].includes(e.name)||e.isSymbolicLink())continue;const f=path.join(dir,e.name);if(e.isDirectory())await collect(f,depth+1);else if(e.isFile()&&/\.(?:build|bld|inc)$/.test(e.name)){const b=await readFile(f);bytes+=b.length;if(bytes>10000000||Object.keys(files).length>=250)throw Error('Workspace limit: 250 buildfiles / 10 MB.');files[path.relative(root,f).split(path.sep).join('/')]=b.toString('utf8');}}}
 await collect(root);const name=path.relative(root,absolute).split(path.sep).join('/');const input=await readFile(absolute,'utf8');const report=analyze(input,{filename:name,files});
 if(baseline){const old=await realpath(baseline);if(!old.startsWith(root+path.sep))throw Error('Baseline is outside workspace.');const oldname=path.relative(root,old).split(path.sep).join('/');report.comparison=compare(analyze(await readFile(old,'utf8'),{filename:name,files}),report);}
 if(format==='json')console.log(JSON.stringify(report,null,2));else if(format==='sarif')console.log(JSON.stringify(sarif(report),null,2));else{console.log(`BootLens · ${report.profile}\n${name} · ${report.architecture} · ${report.coverage}\n${report.entries.length} entries / ${report.commands.length} startup commands\n`);for(const f of report.findings)console.log(`${f.file}:${f.line} ${f.level.toUpperCase()} ${f.code}: ${f.message}\n  ${f.help}`);console.log(`\n${report.counts.error} errors, ${report.counts.warning} warnings, ${report.counts.note} notes.\n${report.disclaimer}`);}
 process.exitCode=fail==='never'?0:report.counts.error>0||fail==='warning'&&report.counts.warning>0?1:0;
}catch(e){console.error('BootLens: '+e.message);process.exitCode=2;}
