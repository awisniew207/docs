import { registry } from '../api/api';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  openapi: '3.0.4',
  info: {
    title: 'Vincent Registry',
    description: 'Vincent Registry APIs!',
    contact: {
      email: 'andrew@litprotocol.com',
    },
    license: {
      name: 'Apache 2.0',
      url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
    },
    version: '1.0.12',
  },
});

const openApiYaml = yaml.dump(openApiDocument);

const outputPath = path.join(__dirname, '../generated/openapi.yaml');
fs.writeFileSync(outputPath, openApiYaml, 'utf8');

console.log(`OpenAPI YAML generated at: ${outputPath}`);
