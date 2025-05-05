import { z } from 'zod';

import { formatZodErrorString } from '.';
import type { VincentToolDef } from '../../types';

export const parseToolParams = ({ toolParams, toolParamsSchema }: { toolParams: z.infer<VincentToolDef<any, any>['toolParamsSchema']>, toolParamsSchema: z.ZodType<any, any, any> }) => {
    try {
        return toolParamsSchema.parse(toolParams);
    } catch (error) {
        const errorMessage = error instanceof z.ZodError ? formatZodErrorString(error) : error instanceof Error ? error.message : String(error);
        throw new Error(`Error parsing toolParams using Zod toolParamsSchema (parseToolParams): ${errorMessage}`);
    }
}