const parsef = require('./lib/parse-function')
const args = require('function-arguments');
const _ = require('lodash');
const dox = require('dox');
const fs = require('fs');
const colors = require('colors');

// Will crawl project folders for js files
const filePath = './sample/test.js';

fs.readFile(filePath, 'utf8', function(err, contents) {
  if (err) {
    return console.log(err);
  }

  const parsed = dox.parseComments(contents);

  console.log(`Scanning ${filePath}`.magenta);

  _.each(parsed, (block) => {
    const comparison = argsMatchDocs(block);
    const details = `${block.line}:${block.codeStart}`;
    const isBlockModule = isModule(block);

    if(isBlockModule) return;

    const functionName = getFunctionName(block);

    if(comparison.matches) {
      console.log(`${functionName} (${details}) looks good ✓`.green);
    } else {
      const args = comparison.docArgs > 1 ? "args" : "arg";
      // tell you what you forgot to document or what's out of date
      console.log(`${functionName} (${details}) is wrong or undocumented × \n
It documents: ${comparison.docArgs.length} ${args}, but there are ${comparison.codeArgs.length} in the code}`.red);

      const outdated = getOutdatedArgs(comparison.docArgs);
      console.log('Incorrect: \n', outdated, '\n');
      console.log('Function: '.red);
      console.log(comparison.code);
      console.log('\n`````````````````````````````````\n');
    }
  });

});

function isModule(block) {
  return _.find(block.tags, { type: 'module' });
}

function getCode(block) {
  return block.code;
}

// For now it only tells you which args are wrong
function getOutdatedArgs(docArgs) {
  const args = _.map(docArgs, function(arg) {
    if( arg.type === 'param') {
      return arg.name || arg.string;
    }
  });

  return _.without(args, undefined);
}

function getFunctionName(block) {
  return block.ctx.name;
}

function getCodeArgs(code) {
  const js = parsef(code);
  return js.args || [];
}

function getDocArgs(block) {
  const tags = block.tags;
  const args = _.map(tags, (tag) => {
    if(tag.type === 'param') {
      return tag;
    }
  });
  return _.without(args, undefined);
}

function argsMatchDocs(block) {
  const code = getCode(block);

  if(code) {
    const docArgs = getDocArgs(block);
    const codeArgs = getCodeArgs(code);

    return {
      // Only matches by length for now
      matches: (docArgs.length === codeArgs.length),
      docArgs,
      codeArgs,
      code
    }
  }

  return {
    invalid: true
  }
}
