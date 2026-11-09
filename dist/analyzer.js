/* BootLens: documented subset analyzer for QNX SDP 8.0 mkifs. No code is executed. */
export const DOC='https://qnx.com/developers/docs/8.0/com.qnx.doc.neutrino.utilities/topic/m/mkifs.html';
export const RULES={
 BL001:['Malformed structure','Repair unmatched attributes or an unterminated inline file.'],
 BL002:['Analysis boundary','Resolve the indicated include, variable, external script or unsupported construct before treating coverage as complete.'],
 BL010:['No bootstrap inspected','If this is a bootable image, provide its virtual bootstrap. Nonbootable images may intentionally omit it.'],
 BL011:['Bootstrap placement','Place the bootfile before every other file specification.'],
 BL012:['Bootstrap order','The first executable must be startup-* and the last executable must be procnto*.'],
 BL013:['Multiple bootfiles','Only one virtual bootfile may be specified.'],
 BL020:['Conflicting image entry','Give each explicitly declared target path a single definition.'],
 BL021:['Script executable not declared','Add the executable to the image, or verify the filesystem supplying it is available before this command.'],
 BL022:['Shell syntax in startup script','mkifs startup scripts are not general shell scripts. Invoke an included shell explicitly when shell features are needed.'],
 BL023:['Foreground resource manager','A long-running foreground process can prevent later startup commands. Review whether this resource manager should run in the background.'],
 BL024:['Temporary filesystem caveat','A /tmp link to /dev/shmem is not a complete filesystem. Use an appropriate filesystem for a production deployment.'],
 BL025:['Runtime linker path not declared','For dynamically linked programs, check that /usr/lib/ldqnx-64.so.2 is provided or linked to the runtime linker. This check does not inspect ELF dependencies.']
};
export function normalize(p){const out=[];for(const x of p.replace(/\\/g,'/').split('/')){if(!x||x==='.')continue;if(x==='..'){if(out.length)out.pop();else return null;}else out.push(x);}return (p.startsWith('/')?'/':'')+out.join('/');}
export function words(s){const out=[];let word='',q=null,escape=false;for(const c of s){if(escape){word+=c;escape=false;continue;}if(c==='\\'){escape=true;continue;}if(q){if(c===q)q=null;else word+=c;continue;}if(c==='"'||c==="'"){q=c;continue;}if(/\s/.test(c)){if(word){out.push(word);word='';}}else word+=c;}if(escape)word+='\\';if(word)out.push(word);return out;}
function uncomment(s){let q=null;for(let i=0;i<s.length;i++){const c=s[i];if(c==='\\'){i++;continue;}if(q){if(c===q)q=null;}else if(c==='"'||c==="'")q=c;else if(c==='#'&&(i===0||/\s/.test(s[i-1])))return s.slice(0,i);}return s;}
function stripAttrs(s){let rest=s.trim(),attrs={};while(rest.startsWith('[')){let q=null,close=-1;for(let i=1;i<rest.length;i++){if(rest[i]==='\\'){i++;continue;}if(q){if(rest[i]===q)q=null;}else if(rest[i]==='"'||rest[i]==="'")q=rest[i];else if(rest[i]===']'){close=i;break;}}if(close<0)return {rest,attrs,error:true};for(const token of words(rest.slice(1,close))){const m=token.match(/^([+-])(.+)$/);if(m)attrs[m[2]]=m[1]==='+';else{let i=token.indexOf('=');if(i<0)attrs[token]=true;else attrs[token.slice(0,i)]=token.slice(i+1);}}rest=rest.slice(close+1).trim();}return {rest,attrs};}
function command(s){const a=stripAttrs(uncomment(s).trim());const tokens=words(a.rest),env={};while(tokens.length&&/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[0])){const t=tokens.shift(),i=t.indexOf('=');env[t.slice(0,i)]=t.slice(i+1);}return {name:tokens[0]||null,args:tokens.slice(1),env,attrs:a.attrs,raw:a.rest,background:/&\s*$/.test(a.rest),error:a.error};}
const base=p=>p.split('/').pop();
export function analyze(input,{filename='image.build',files={}}={}){
 if(typeof input!=='string'||input.length>2000000)throw Error('Buildfile must be text smaller than 2 MB.');
 const findings=[],entries=[],commands=[],bootstraps=[],sourceFiles={},seen=new Set(),stack=[],globals={},budget={lines:0};let covered=true;
 function add(code,level,file,line,message,detail=''){findings.push({code,level,file,line:Math.max(1,line),message,detail,help:RULES[code][1],url:DOC});if(code==='BL001'||code==='BL002')covered=false;}
 function partial(file,line,msg){add('BL002','warning',file,line,msg);}
 function parse(text,file){
  if(stack.includes(file)){add('BL002','error',file,1,'Circular include: '+[...stack,file].join(' → '));return;}
  if(seen.has(file))return;if(stack.length>=32){partial(file,1,'Include nesting exceeds the 32-file analysis limit.');return;}seen.add(file);stack.push(file);sourceFiles[file]=text;
  const raw=text.replace(/\r\n?/g,'\n').split('\n');let block=null;
  for(let i=0;i<raw.length;i++){
   if(++budget.lines>50000){partial(file,i+1,'Analysis stopped at the 50,000-line limit.');break;}
   const line=i+1;let content=raw[i];
   if(block){if(content.trim()==='}'){block.closed=true;block=null;}else block.body.push({text:content,file,line});continue;}
   // Line continuation is supported only outside inline files, matching mkifs.
   while(/(?<!\\)(?:\\\\)*\\$/.test(content)&&i+1<raw.length){content=content.slice(0,-1)+' '+raw[++i];}
   const cleaned=uncomment(content).trim();if(!cleaned)continue;
   const {attrs,rest,error}=stripAttrs(cleaned);if(error){add('BL001','error',file,line,'Unclosed attribute list.');continue;}
   if('include'in attrs){
    if(rest)partial(file,line,'Include combined with a file declaration is outside the supported subset.');
    for(const path of words(String(attrs.include))){const rel=normalize((file.includes('/')?file.slice(0,file.lastIndexOf('/')+1):'')+path);if(!rel||path.startsWith('/')||path.includes('$')){partial(file,line,'Absolute or variable include not expanded: '+path);continue;}if(Object.hasOwn(files,rel))parse(files[rel],rel);else partial(file,line,'Included buildfile not supplied: '+rel);}
    continue;
   }
   if(!rest){Object.assign(globals,attrs);continue;}
   if(rest==='}'){add('BL001','error',file,line,'Unexpected closing inline brace.');continue;}
   const effective={...globals,...attrs};
   let target,source,inline=false;
   const eq=rest.indexOf('=');if(eq>=0){target=words(rest.slice(0,eq).trim())[0];source=rest.slice(eq+1).trim();inline=source==='{'||source.startsWith('{ ');}else{target=words(rest)[0];source=target;}
   if(!target){add('BL001','error',file,line,'Missing target filename.');continue;}
   if(!inline&&words(source).length>1){partial(file,line,'Multiple unquoted source tokens are not interpreted.');}
   const isBoot='virtual'in effective||'physical'in effective;
   const kind=isBoot?'bootstrap':effective.script?'script':effective.type==='link'?'link':effective.type==='dir'?'directory':inline?'inline':'file';
   let mount=String(effective.mount??'/'),prefix=String(effective.prefix??'proc/boot');
   // Relative image path expansion is deliberately explicit; non-boot images are corrected after parsing.
   const path=target.startsWith('/')?normalize(target):normalize(mount+'/'+prefix+'/'+target);
   const entry={target,path,source:inline?null:words(source)[0]||'',kind,file,line,attrs:effective,body:[],closed:!inline,implicitPrefix:!('prefix'in effective)};entries.push(entry);
   if(target.includes('$')||source.includes('$')||mount.includes('$')||prefix.includes('$'))partial(file,line,'Variables are not expanded for this entry: '+target);
   if('physical'in effective)partial(file,line,'physical addressing is not implemented in QNX SDP 8.0; review the virtual attribute.');
   if(isBoot){entry.arch=String(effective.virtual||effective.physical).split(/[,/]/)[0];bootstraps.push(entry);}
   if(inline){
    if(source==='{'||source==='{ '){block=entry;}
    else {const close=source.lastIndexOf('}');if(close<0){entry.body.push({text:source.slice(1),file,line});block=entry;}else{entry.body.push({text:source.slice(1,close),file,line});entry.closed=true;}}
   }else if(kind==='bootstrap'||kind==='script')partial(file,line,'External '+kind+' content is not inspected: '+entry.source);
  }
  if(block)add('BL001','error',file,block.line,'Inline file is not closed: '+block.target);
  stack.pop();
 }
 parse(input,normalize(filename)||'image.build');
 if(!bootstraps.length){add('BL010','note',filename,1,'No virtual bootstrap was inspected; this may be a nonbootable image.');for(const e of entries)if(e.implicitPrefix&&!e.target.startsWith('/'))e.path=normalize(String(e.attrs.mount??'/')+'/'+e.target);}
 if(bootstraps.length>1)add('BL013','error',bootstraps[1].file,bootstraps[1].line,'More than one bootfile specification.');
 if(bootstraps[0]&&entries.indexOf(bootstraps[0])!==0)add('BL011','error',bootstraps[0].file,bootstraps[0].line,'Bootfile follows another image file specification.');
 for(const boot of bootstraps){const list=[];for(const l of boot.body){const c=command(l.text);if(c.name)list.push({...c,...l});}if(boot.source===null&&(list.length<2||!base(list[0].name).startsWith('startup-')||!base(list.at(-1).name).startsWith('procnto')))add('BL012','error',boot.file,boot.line,'Bootstrap must begin with startup-* and end with procnto*.');}
 const paths=new Map();for(const e of entries){if(e.path===null){partial(e.file,e.line,'Target path escapes its root: '+e.target);continue;}if(paths.has(e.path)){const prev=paths.get(e.path);add('BL020','error',e.file,e.line,'Duplicate target '+e.path,`First declared at ${prev.file}:${prev.line}.`);}else paths.set(e.path,e);if(e.kind==='link'&&e.path==='/tmp'&&e.source.startsWith('/dev/shmem'))add('BL024','warning',e.file,e.line,'/tmp links to /dev/shmem.');}
 const builtins=new Set(['display_msg','procmgr_symlink','reopen','waitfor']);let globalModifiers={};
 for(const script of entries.filter(e=>e.kind==='script')){
  for(const l of script.body){const c=command(l.text);if(c.error){add('BL001','error',l.file,l.line,'Unclosed startup modifier list.');continue;}if(!c.name){Object.assign(globalModifiers,c.attrs);continue;}const modifiers={...globalModifiers,...c.attrs};const cmd={...c,...l,modifiers,kind:builtins.has(c.name)&&!modifiers.external?'internal':'external',resolved:null};commands.push(cmd);
   if(/(?:\|\||&&|[|;<>])/.test(c.raw.replace(/"[^"\n]*"|'[^'\n]*'/g,'')))add('BL022','warning',l.file,l.line,'Shell operators found in mkifs startup script.');
   if(cmd.kind==='external'){
    const candidates=entries.filter(e=>['file','link','inline'].includes(e.kind)&&(c.name.startsWith('/')?e.path===normalize(c.name):base(e.target)===c.name));
    cmd.resolved=candidates[0]?.path||null;if(!candidates.length)add('BL021','warning',l.file,l.line,'Executable is not explicitly declared in this image: '+c.name,'It may come from an external filesystem or automatic expansion; verify its availability at this point.');
    if(/^(dev[cbsf]-|io-)/.test(base(c.name))&&!c.background)add('BL023','warning',l.file,l.line,'Review foreground resource manager: '+c.name);
   }
   if(c.name==='procmgr_symlink'&&c.args[0]?.startsWith('/dev/shmem')&&c.args[1]==='/tmp')add('BL024','warning',l.file,l.line,'/tmp is mapped to /dev/shmem.');
  }
 }
 if(commands.some(c=>c.kind==='external')&&!entries.some(e=>e.path==='/usr/lib/ldqnx-64.so.2')&&!commands.some(c=>c.name==='procmgr_symlink'&&c.args[1]==='/usr/lib/ldqnx-64.so.2'))add('BL025','note',filename,1,'Expected QNX 8.0 runtime linker path is not explicitly declared.','This may be intentional for static executables or an externally supplied filesystem.');
 const counts={error:0,warning:0,note:0};for(const f of findings)counts[f.level]++;
 return {tool:'BootLens',version:'1.0.0',profile:'QNX SDP 8.0 mkifs',filename,coverage:covered?'supported-subset':'partial',counts,findings,entries,commands,sourceFiles,architecture:bootstraps[0]?.arch||'not specified',disclaimer:'Static preflight only. No QNX SDK or target execution performed. Not a replacement for mkifs, ELF dependency analysis, or boot testing.'};
}
export function sarif(report){return {version:'2.1.0',$schema:'https://json.schemastore.org/sarif-2.1.0.json',runs:[{tool:{driver:{name:'BootLens',version:'1.0.0',informationUri:DOC,rules:Object.entries(RULES).map(([id,[name,help]])=>({id,name:name.replace(/[^a-zA-Z0-9]/g,''),shortDescription:{text:name},help:{text:help},helpUri:DOC}))}},results:report.findings.map(f=>({ruleId:f.code,level:f.level,message:{text:f.message+(f.detail?' '+f.detail:'')},locations:[{physicalLocation:{artifactLocation:{uri:f.file.split('/').map(encodeURIComponent).join('/')},region:{startLine:f.line}}}]}))}]};}
export function compare(before,after){const key=f=>[f.code,f.file,f.message].join('|');const old=new Set(before.findings.map(key)),next=new Set(after.findings.map(key));return {resolved:before.findings.filter(f=>!next.has(key(f))),introduced:after.findings.filter(f=>!old.has(key(f))),unchanged:after.findings.filter(f=>old.has(key(f)))};}
