import React from 'react';
import { LogLevel } from '../types';
import { useLogs } from '../hooks';
import { Card, Button } from './DesignSystem';
import { X, RefreshCw } from 'lucide-react';

// Composition: Header
const ViewerHeader = ({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) => (
    <div className="flex justify-between items-center p-4 border-b border-dark-border bg-slate-900">
        <h2 className="text-xl font-bold text-primary font-mono">System Logs (Debug Mode)</h2>
        <div className="flex gap-2">
        <Button variant="secondary" onClick={onRefresh} className="!p-2">
            <RefreshCw size={18} />
        </Button>
        <Button variant="danger" onClick={onClose} className="!p-2">
            <X size={18} />
        </Button>
        </div>
    </div>
);

// Composition: Log Entry
const LogEntry = ({ log }: { log: any }) => (
    <div className="border-b border-slate-800 pb-1 mb-1">
        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
        <span className={`mx-2 font-bold ${
        log.level === LogLevel.ERROR ? 'text-red-500' :
        log.level === LogLevel.WARN ? 'text-warning' :
        log.level === LogLevel.ACTION ? 'text-secondary' : 'text-slate-300'
        }`}>
        {log.level}
        </span>
        <span className="text-accent">[{log.origin}]</span>: 
        <span className="text-slate-200 ml-2">{log.message}</span>
        {log.context && <div className="text-slate-600 pl-4 mt-1 break-all">{log.context}</div>}
    </div>
);

export const LogViewer = ({ onClose }: { onClose: () => void }) => {
  const { logs, fetchLogs } = useLogs();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border-primary border-2 shadow-2xl shadow-primary/20">
        <ViewerHeader onClose={onClose} onRefresh={fetchLogs} />
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-black font-mono text-xs">
          {logs.map((log) => <LogEntry key={log.id} log={log} />)}
        </div>
      </Card>
    </div>
  );
};