import { exec } from 'child_process';
import * as path from 'path';

const yamlPath = path.join(__dirname, '../api/generated-openapi.yaml');
const outputDir = path.join(__dirname, '../common/api');

const command = `npx openapi --input ${yamlPath} --name Api --postfixServices Api --indent 2 --output ${outputDir}`;

console.log('Generating OpenAPI client...');
console.log(command);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
  console.log(`OpenAPI client code generated successfully in ${outputDir}`);
});
