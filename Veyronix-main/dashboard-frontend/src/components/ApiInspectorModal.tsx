import React, { useState } from 'react';
import { X, Terminal, Copy, Check, Send } from 'lucide-react';
import { ThermalEvent, AnalysisResponse } from '../types';

interface ApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: ThermalEvent;
  analysisResult: AnalysisResponse | null;
}

export const ApiInspectorModal: React.FC<ApiInspectorModalProps> = ({
  isOpen,
  onClose,
  selectedEvent,
  analysisResult,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const requestJson = {
    event_id: selectedEvent.id,
  };

  const responseJson = analysisResult || {
    event_id: selectedEvent.id,
    abnormality: selectedEvent.abnormality,
    source: selectedEvent.likelySource,
    priority: selectedEvent.investigationPriority,
    confidence: selectedEvent.confidence,
    evidence: selectedEvent.evidence,
    ...(selectedEvent.insufficientEvidence
      ? {
          insufficient_evidence: true,
          message: 'Evidence insufficient for reliable attribution.',
        }
      : {}),
    analysis_timestamp: new Date().toISOString(),
    processing_latency_ms: 380,
  };

  const curlCommand = `curl -X POST http://localhost:3000/analyze-event \\
  -H "Content-Type: application/json" \\
  -d '{"event_id": "${selectedEvent.id}"}'`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-tech font-bold text-zinc-100 uppercase tracking-wide">
              PROTOTYPE BACKEND API CONTRACT
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono-code text-xs">
          {/* Endpoint badge */}
          <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800 text-[11px]">
                POST
              </span>
              <span className="text-zinc-200 font-semibold">/analyze-event</span>
            </div>
            <span className="text-[10px] text-zinc-400">Express REST Backend</span>
          </div>

          {/* Request Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>REQUEST BODY (JSON):</span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(requestJson, null, 2))}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 overflow-x-auto text-[11px]">
              {JSON.stringify(requestJson, null, 2)}
            </pre>
          </div>

          {/* Response Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>RESPONSE PAYLOAD (200 OK):</span>
              <span className="text-emerald-400">application/json</span>
            </div>
            <pre className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-amber-300 overflow-x-auto text-[11px]">
              {JSON.stringify(responseJson, null, 2)}
            </pre>
          </div>

          {/* cURL command */}
          <div className="space-y-1.5">
            <div className="text-[11px] text-zinc-400">CURL COMMAND:</div>
            <pre className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-850 text-zinc-400 overflow-x-auto text-[10px]">
              {curlCommand}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
