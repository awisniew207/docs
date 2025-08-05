import { Button } from '@/components/shared/ui/button';
import { Hash, User, Mail, Copy, CheckCircle, Calendar, Clock, Zap, Globe } from 'lucide-react';
import { useState } from 'react';
import { App } from '@/types/developer-dashboard/appTypes';

export function AppInfo({ app }: { app: App }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Basic Information Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6 hover:border-black/20 transition-all duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-black/5 border border-black/5">
              <Hash className="w-5 h-5 text-black/60" />
            </div>
            <h2 className="text-lg font-light text-black transition-colors duration-500">
              Basic Information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="group/item">
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all duration-300">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">App ID</p>
                  <p className="text-sm text-black/90 break-all">{app.appId}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(app.appId.toString(), 'appId')}
                  className="text-gray-500 hover:text-black ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300"
                >
                  {copiedField === 'appId' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {app.activeVersion && (
              <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-black/40" />
                  <p className="text-xs font-medium text-gray-500">Active Version</p>
                </div>
                <p className="text-sm text-black/90">v{app.activeVersion}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-black/40" />
                  <p className="text-xs font-medium text-gray-500">Created</p>
                </div>
                <p className="text-sm text-black/90">
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-black/40" />
                  <p className="text-xs font-medium text-gray-500">Updated</p>
                </div>
                <p className="text-sm text-black/90">
                  {new Date(app.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact & Management Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-black/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <div className="relative bg-white/40 backdrop-blur-xl border border-black/10 rounded-2xl p-6 hover:border-black/20 transition-all duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-black/5 border border-black/5">
              <User className="w-5 h-5 text-black/60" />
            </div>
            <h2 className="text-lg font-light text-black transition-colors duration-500">
              Contact & Management
            </h2>
          </div>

          <div className="space-y-4">
            {app.contactEmail && (
              <div className="group/item">
                <div className="flex items-center justify-between p-4 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all duration-300">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Mail className="w-4 h-4 text-black/40" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Contact Email</p>
                      <p className="text-sm text-black/90 break-all">{app.contactEmail}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(app.contactEmail || '', 'email')}
                    className="text-gray-500 hover:text-black ml-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300"
                  >
                    {copiedField === 'email' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {app.appUserUrl && (
              <div className="p-4 rounded-xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-black/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-500 mb-1">App URL</p>
                    <a
                      href={app.appUserUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm !text-orange-600 hover:!text-orange-700 underline break-all transition-colors duration-300"
                    >
                      {app.appUserUrl}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
