#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { parseMarkdown, serializeToMarkdown } from './parser-utils';

function showHelp() {
  console.log(`
Taskdown CLI - Jira-style Markdown parser and serializer

Usage:
  npm run dev -- parse <markdown-file>     Parse Markdown to JSON
  npm run dev -- serialize <json-file>     Serialize JSON to Markdown
  npm run dev -- roundtrip <markdown-file> Parse and serialize back to Markdown
  npm run dev -- help                      Show this help

Examples:
  npm run dev -- parse example.md
  npm run dev -- roundtrip example.md
  `);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }
  
  const command = args[0];
  const filename = args[1];
  
  if (!filename && command !== 'help') {
    console.error('Error: Filename required');
    showHelp();
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'parse':
        handleParse(filename);
        break;
        
      case 'serialize':
        handleSerialize(filename);
        break;
        
      case 'roundtrip':
        handleRoundtrip(filename);
        break;
        
      default:
        console.error(`Error: Unknown command "${command}"`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function handleParse(filename: string) {
  // When run via npm workspaces, use INIT_CWD to get the original working directory
  const originalCwd = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(originalCwd, filename);
  
  const markdown = fs.readFileSync(resolvedPath, 'utf-8');
  const boardData = parseMarkdown(markdown);
  
  console.log('Parsed board data:');
  console.log(JSON.stringify(boardData, null, 2));
}

function handleSerialize(filename: string) {
  const originalCwd = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(originalCwd, filename);
  
  const jsonData = fs.readFileSync(resolvedPath, 'utf-8');
  const boardData = JSON.parse(jsonData);
  
  const markdown = serializeToMarkdown(boardData);
  console.log('Serialized markdown:');
  console.log(markdown);
}

function handleRoundtrip(filename: string) {
  const originalCwd = process.env.INIT_CWD || process.cwd();
  const resolvedPath = path.resolve(originalCwd, filename);
  
  console.log(`\n=== Original Markdown (${filename}) ===`);
  const originalMarkdown = fs.readFileSync(resolvedPath, 'utf-8');
  console.log(originalMarkdown);
  
  console.log('\n=== Parsed to JSON ===');
  const boardData = parseMarkdown(originalMarkdown);
  console.log(JSON.stringify(boardData, null, 2));
  
  console.log('\n=== Serialized back to Markdown ===');
  const serializedMarkdown = serializeToMarkdown(boardData);
  console.log(serializedMarkdown);
  
  console.log('\n=== Summary ===');
  console.log(`Original epics: ${boardData.epics.length}`);
  
  let totalCards = 0;
  let totalAcceptanceCriteria = 0;
  let totalTechnicalTasks = 0;
  
  for (const epic of boardData.epics) {
    totalCards += epic.cards.length;
    for (const card of epic.cards) {
      totalAcceptanceCriteria += card.acceptanceCriteria.length;
      totalTechnicalTasks += card.technicalTasks.length;
    }
  }
  
  console.log(`Total cards: ${totalCards}`);
  console.log(`Total acceptance criteria: ${totalAcceptanceCriteria}`);
  console.log(`Total technical tasks: ${totalTechnicalTasks}`);
}

if (require.main === module) {
  main();
}