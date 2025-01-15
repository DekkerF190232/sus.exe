import * as fs from 'node:fs';
import path from 'path';
import * as compiler from './compiler.js';
import process from 'node:process';
import { EOL } from 'node:os';

const makeUnit = (sourceFile, empty) => ({ sourceFile, empty }); // sourceFile path is relative to source folder
const makeBuildInfo = (sourceFolder, buildFolder, compileConfig) => ({
  sourceFolder,
  buildFolder,
  compileConfig,
});

const EXT_SRC = '.sus';
const EXT_TREE = '.stj'; // sussy tree json
const EXT_ASM = '.sus.asm';
const EXT_OBJ = '.sus.obj';

(function run() {
  let params = process.argv.slice(2);

  let doShowAlign = false;
  let doShowFuncs = false;
  let sourceFolder = undefined;
  let parsValid = true;

  for (const p of params) {
    if (p.startsWith('-')) {
      if (p === '-show-align') {
        doShowAlign = true;
      } else if (p === '-show-func-sigs') {
        doShowFuncs = true;
      } else {
        console.log('error: unknown flag: ' + p);
        parsValid = false;
        break;
      }
    } else {
      if (sourceFolder) {
        console.log('error: duplicate build folder: ' + p);
        parsValid = false;
        break;
      }
      sourceFolder = p;
    }
  }

  let compileConfig = compiler.makeCompileConfig(doShowAlign, doShowFuncs); //...EOL;

  if (!parsValid) {
    console.log('usage:');
    console.log('  compiler_node.js <folder> [-show-align] [--show-func-sigs]');
    console.log('');
    process.exit(1);
  }

  console.log('Sussing "' + sourceFolder + '"' + EOL);

  let units = listFiles(sourceFolder)
    .filter((x) => x.endsWith(EXT_SRC))
    .map((x) => makeUnit(x.slice(path.join(sourceFolder).length), false));

  let buildFolder = '.sus-build';
  let buildInfo = makeBuildInfo(sourceFolder, buildFolder, compileConfig);

  cleanBuild(buildInfo);
  let context = buildContext(buildInfo, units);

  compile(context, buildInfo, units);

  genScripts(buildInfo, units, context);

  process.exit(0);
})();

// function cleanBuild(buildInfo) {
//   if (!fs.existsSync(buildInfo.buildFolder)) {
//     fs.mkdirSync(buildInfo.buildFolder);
//   }
//   fs.readdirSync(buildInfo.buildFolder).forEach((file) => fs.rmSync(`${buildInfo.buildFolder}/${file}`));
// }

function cleanBuild(buildInfo) {
  let binFolder = path.join(buildInfo.buildFolder, 'bin');
  fs.rmSync(binFolder, { recursive: true, force: true });
}

function buildContext(buildInfo, units) {
  console.log('Building context');

  let ctx = compiler.doMakeContext(buildInfo.compileConfig);

  for (const unit of units) {
    let srcPath = path.join(buildInfo.sourceFolder, unit.sourceFile);
    let src = fs
      .readFileSync(srcPath, { encoding: 'utf-8' })
      .replaceAll(EOL, '\n');
    compiler.addToContext(ctx, path.resolve(srcPath), src);

    console.log('  ' + unit.sourceFile);
  }
  compiler.addToContextDone(ctx);

  console.log('');

  return ctx;
}

function compile(ctx, buildInfo, units) {
  console.log('Compiling');

  let mainFound = false;

  for (const unit of units) {
    let fileName = unit.sourceFile.slice(
      0,
      unit.sourceFile.length - EXT_SRC.length
    );
    if (unit.sourceFile === 'main' + EXT_SRC) mainFound = true;

    let binFolder = path.join(buildInfo.buildFolder, 'bin');
    let srcPath = path.join(buildInfo.sourceFolder, unit.sourceFile);

    let stjPath = path.join(binFolder, fileName + EXT_TREE);
    let asmPath = path.join(binFolder, fileName + EXT_ASM);
    let src = fs
      .readFileSync(srcPath, { encoding: 'utf-8' })
      .replaceAll('\r', '');

    let tree = compiler.doParse(ctx, path.resolve(srcPath), src);

    ensureDirectoryExistence(stjPath);
    fs.writeFileSync(stjPath, JSON.stringify(tree, null, 2), {
      encoding: 'utf-8',
    });

    let isMain = unit.sourceFile === 'main' + EXT_SRC;
    let asm = compiler.doCompile(ctx, path.resolve(srcPath), src, isMain, tree);

    if (asm === '') {
      console.log('  (Empty) ' + unit.sourceFile);
      unit.empty = true;
      continue;
    }

    fs.writeFileSync(asmPath, asm, { encoding: 'utf-8' });

    console.log('  ' + unit.sourceFile);
  }

  if (!mainFound) {
    throw new Error(
      'could not find ' +
        path.resolve(path.join(buildInfo.sourceFolder, 'main' + EXT_SRC))
    );
  }

  console.log('');
}

function genScripts(buildInfo, units, context) {
  let buildBatPath = path.join(buildInfo.buildFolder, 'build.bat');

  let bat = '';

  bat += ':: Generated by Sussy Compiler ::' + EOL;

  let buildCommands = [];

  for (const unit of units) {
    if (unit.empty) continue;

    // prettier-ignore
    let fileName = unit.sourceFile.slice(0, unit.sourceFile.length - EXT_SRC.length );
    let asmPathIn = path.join('bin', fileName + EXT_ASM);
    buildCommands.push('nasm -f win32 -gcv8 ' + asmPathIn);
  }
  let buildCommand = '(' + EOL + buildCommands.map(x => '  ' + x + EOL).join('')  + ')' + EOL;
  bat += buildCommand;
  bat += EOL;
  
  // prettier-ignore
  let strLibs = '"C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\um\\x86\\OpenGL32.Lib" "C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\um\\x86\\Gdi32.Lib" "C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\um\\x86\\User32.lib" "C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\um\\x86\\kernel32.lib" "C:\\Program Files (x86)\\Windows Kits\\10\\Lib\\10.0.22621.0\\ucrt\\x86\\ucrt.lib"';
  let strObjPaths = '';

  for (const unit of units) {
    if (unit.empty) continue;

    // prettier-ignore
    let fileName = unit.sourceFile.slice( 0, unit.sourceFile.length - EXT_SRC.length );
    let objPathIn = path.join('bin', fileName + EXT_OBJ);

    if (strObjPaths.length > 0) strObjPaths += ' ';
    strObjPaths += '"' + objPathIn + '"';
  }

  // prettier-ignore
  bat += 'link /out:sus.exe /subsystem:windows /nodefaultlib /entry:main /debug /pdb:sus.pdb ' +
   strObjPaths + ' ' + strLibs;

  fs.writeFileSync(buildBatPath, bat, { encoding: 'utf-8' });
}

// utilities

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return true;
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function listFiles(folder) {
  let results = [];
  let files = fs.readdirSync(folder);

  for (const file of files) {
    let totalPath = path.join(folder, file);
    let stat = fs.lstatSync(totalPath);
    if (stat.isDirectory()) {
      results.push(...listFiles(totalPath));
    } else if (stat.isFile()) {
      results.push(totalPath);
    }
  }

  return results;
}
