/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
 
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AppApi } from './services/AppApi';
import { AppVersionApi } from './services/AppVersionApi';
import { ToolApi } from './services/ToolApi';
import { ToolVersionApi } from './services/ToolVersionApi';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class Api {
  public readonly app: AppApi;
  public readonly appVersion: AppVersionApi;
  public readonly tool: ToolApi;
  public readonly toolVersion: ToolVersionApi;
  public readonly request: BaseHttpRequest;
  constructor(
    config?: Partial<OpenAPIConfig>,
    HttpRequest: HttpRequestConstructor = FetchHttpRequest,
  ) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? '',
      VERSION: config?.VERSION ?? '1.0.12',
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? 'include',
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });
    this.app = new AppApi(this.request);
    this.appVersion = new AppVersionApi(this.request);
    this.tool = new ToolApi(this.request);
    this.toolVersion = new ToolVersionApi(this.request);
  }
}
