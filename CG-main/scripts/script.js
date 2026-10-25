import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptsDirectory, '..');
const inputPath = path.join(scriptsDirectory, 'rcode.js');
const outputDirectory = path.join(projectDirectory, 'lib');
const outputPath = path.join(outputDirectory, 'payload.js');
const rawCode = fs.readFileSync(inputPath, 'utf8');

const obfuscationResult = JavaScriptObfuscator.obfuscate(rawCode, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1
});

const obfuscatedCode = obfuscationResult.getObfuscatedCode();

const fileContent = `export default ${JSON.stringify(obfuscatedCode)};`;

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(outputPath, fileContent);

console.log('✅ Payload obfuscated and saved to lib/payload.js!');