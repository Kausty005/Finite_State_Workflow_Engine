import React, { useState } from 'react';
import { X, Sparkles, Plus, FileText, Layers, Check } from 'lucide-react';
import clsx from 'clsx';
import { WorkflowItem } from '../../types';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WorkflowItem[];
  onCreate: (payload: {
    name: string;
    description: string;
    category: string;
    templateId?: string;
  }) => Promise<void>;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  templates,
  onCreate,
}) => {
  const [name, setName] = useState('New Workflow Automaton');
  const [description, setDescription] = useState('Custom deterministic finite state machine workflow');
  const [category, setCategory] = useState('Custom');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        category,
        templateId: selectedTemplateId === 'blank' ? undefined : selectedTemplateId,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-navy-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/40 flex items-center justify-center text-electric-cyan">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Create New Workflow</h3>
              <p className="text-[11px] text-slate-400 font-mono">Configure automaton parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Workflow Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              placeholder="e.g. Order Fulfillment Pipeline"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="Custom">Custom Automation</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="DevOps">Cloud & DevOps</option>
                <option value="Academic">Academic & Verification</option>
                <option value="FinTech">FinTech & Payments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Starting Mode</label>
              <div className="text-xs text-slate-400 p-2.5 rounded-xl bg-navy-950 border border-slate-800 flex items-center justify-between">
                <span>{selectedTemplateId === 'blank' ? 'Blank Canvas' : 'Cloned from Template'}</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Operational description or context..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Blueprint Archetype
            </label>
            <div className="grid grid-cols-2 gap-2.5 max-h-40 overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedTemplateId('blank')}
                className={clsx(
                  'p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs',
                  selectedTemplateId === 'blank'
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100'
                    : 'bg-navy-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                )}
              >
                <FileText className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200">Blank Canvas</div>
                  <div className="text-[10px] text-slate-500 truncate">Initial state + final state scaffold</div>
                </div>
                {selectedTemplateId === 'blank' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={clsx(
                    'p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all text-xs',
                    selectedTemplateId === tpl.id
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100'
                      : 'bg-navy-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  )}
                >
                  <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{tpl.name}</div>
                    <div className="text-[10px] text-slate-500">{tpl.total_states} states</div>
                  </div>
                  {selectedTemplateId === tpl.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-navy-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

