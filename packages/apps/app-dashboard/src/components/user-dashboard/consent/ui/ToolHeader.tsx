import { Settings, ExternalLink, FileCode } from 'lucide-react';
import { ConsentInfoMap } from '@/hooks/user-dashboard/consent/useConsentInfo';
import { ThemeType } from './theme';

interface ToolHeaderProps {
  tool: {
    toolPackageName: string;
    toolVersion: string;
  };
  toolVersion?: {
    ipfsCid: string;
  };
  consentInfoMap: ConsentInfoMap;
  theme: ThemeType;
}

export function ToolHeader({ tool, toolVersion, consentInfoMap, theme }: ToolHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${theme.iconBg} border ${theme.iconBorder}`}>
          <Settings className={`w-5 h-5 ${theme.textMuted}`} />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${theme.text}`}>
            {consentInfoMap.toolsByPackageName[tool.toolPackageName]?.title || tool.toolPackageName}
          </h4>
          <p className={`text-sm ${theme.textMuted} font-medium`}>
            <a
              href={`https://www.npmjs.com/package/${tool.toolPackageName}/v/${tool.toolVersion}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${theme.linkColor} hover:underline inline-flex items-center gap-1`}
            >
              {tool.toolPackageName} - v{tool.toolVersion}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          {consentInfoMap.toolsByPackageName[tool.toolPackageName]?.description && (
            <p className={`text-sm ${theme.textSubtle} mt-1`}>
              {consentInfoMap.toolsByPackageName[tool.toolPackageName].description}
            </p>
          )}
          {toolVersion && (
            <div className="flex items-center gap-2 mt-2">
              <FileCode className={`w-3 h-3 ${theme.textMuted}`} />
              <span className={`text-xs ${theme.textSubtle} font-mono`}>{toolVersion.ipfsCid}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
