import React, { useRef } from 'react';
import {
  Save,
  CheckCheck,
  RotateCcw,
  Download,
  Upload,
  Sparkles,
  Play,
  Share2,
} from 'lucide-react';

interface ToolbarProps {
  workflowName: string;
  onRenameWorkflow: (newName: string) => void;
  onSave: () => void;
  onValidate: () => void;
  onAutoLayout: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (jsonData: string) => void;
  onSimulate: () => void;
  isSaving: boolean;
  isValidating: boolean;
  totalStates: number;
  totalTransitions: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  workflowName,
  onRenameWorkflow,
  onSave,
  onValidate,
  onAutoLayout,
  onClear,
  onExport,
  onImport,
  onSimulate,
  isSaving,
  isValidating,
  totalStates,
  totalTransitions,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImport(content);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-13 border-b border-slate-800 bg-[#090e1a] px-5 py-2.5 flex items-center justify-between gap-4 select-none">
      {/* Workflow Title with inline editing */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={workflowName}
          onChange={(e) => onRenameWorkflow(e.target.value)}
          className="bg-transparent text-sm font-bold text-slate-100 hover:bg-slate-800/40 px-2 py-1 rounded-lg border border-transparent hover:border-slate-700 focus:border-cyan-500 focus:bg-[#070b14] focus:outline-none transition-colors max-w-xs"
          title="Click to rename workflow"
        />

        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-black/40 px-2.5 py-1 rounded-md border border-slate-800">
          <span>{totalStates} States</span>
          <span className="text-slate-600">•</span>
          <span>{totalTransitions} Transitions</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white transition-all shadow-sm"
          title="Hierarchically arrange states from initial to final"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Auto Layout</span>
        </button>

        <button
          onClick={onValidate}
          disabled={isValidating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-800/50 hover:bg-amber-900/50 transition-all shadow-sm disabled:opacity-50"
          title="Run formal automata theory verification checks"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>{isValidating ? 'Verifying...' : 'Validate FSM'}</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#060a14] bg-cyan-400 hover:bg-cyan-300 transition-all shadow-sm disabled:opacity-50"
          title="Save workflow graph to database"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>

        <button
          onClick={onSimulate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-sm"
          title="Switch to live execution simulator"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Export / Import JSON */}
        <button
          onClick={onExport}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title="Export Workflow JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title="Import Workflow JSON"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={onClear}
          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
          title="Clear Canvas"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
