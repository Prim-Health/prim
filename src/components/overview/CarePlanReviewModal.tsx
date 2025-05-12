'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { CarePlanSnapshot } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface CarePlanReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  snapshotId: string;
  snapshot: CarePlanSnapshot;
}

export function CarePlanReviewModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  snapshotId,
  snapshot,
}: CarePlanReviewModalProps) {
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);
  const [previewText, setPreviewText] = useState(snapshot.text_block);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const previewRef = useRef<HTMLPreElement>(null);
  const { createCarePlanSnapshot } = useStore();

  const resetChanges = () => {
    setPreviewText(snapshot.text_block);
    setAcceptedSuggestions([]);
    setHighlightedLines([]);
  };

  const scrollToHighlightedLine = (lineNumber: number) => {
    if (previewRef.current) {
      const lines = previewRef.current.children;
      if (lines[lineNumber]) {
        lines[lineNumber].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleAcceptSuggestion = (suggestion: string) => {
    setAcceptedSuggestions((prev) => [...prev, suggestion]);
    
    // Update preview text based on the suggestion
    setPreviewText((prev) => {
      const lines = prev.split('\n');
      const newLines = lines.map((line, index) => {
        let modified = false;
        let newLine = line;

        // Handle different types of suggestions
        if (suggestion.includes('statin dosage') && line.includes('Atorvastatin')) {
          newLine = line.replace('20 mg', '40 mg');
          modified = true;
        }
        if (suggestion.includes('blood pressure medication') && line.includes('Lisinopril')) {
          newLine = line.replace('Once daily', 'Twice daily');
          modified = true;
        }
        if (suggestion.includes('dietary consultation') && line.includes('Dietary counseling')) {
          newLine = line.replace('Every 2 months', 'Monthly');
          modified = true;
        }
        if (suggestion.includes('follow-up') && line.includes('Time Spent on APCM')) {
          newLine = line + '\n        - 15 min: Follow-up appointment scheduled';
          modified = true;
        }
        if (suggestion.includes('alternative diabetes medication') && line.includes('Metformin')) {
          newLine = line.replace('500 mg', '1000 mg');
          modified = true;
        }

        if (modified) {
          setHighlightedLines((prev) => [...prev, index]);
          setTimeout(() => scrollToHighlightedLine(index), 100);
        }
        return newLine;
      });
      return newLines.join('\n');
    });
  };

  const handleAuthorize = async () => {
    try {
      await createCarePlanSnapshot(patientId, {
        ...snapshot,
        text_block: previewText,
        requiresRevision: false,
        created_at: Timestamp.fromDate(new Date()),
      });
      onClose();
    } catch (error) {
      console.error('Error creating care plan snapshot:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-black font-semibold">Review Care Plan - {patientName}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-4 h-full">
          {/* Left side - Care Plan Preview */}
          <div className="flex-1 overflow-y-auto max-h-[calc(80vh-12rem)] relative">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <pre ref={previewRef} className="whitespace-pre-wrap font-mono text-sm text-black">
                {previewText.split('\n').map((line, index) => (
                  <div
                    key={index}
                    className={`${highlightedLines.includes(index) ? 'bg-green-100' : ''}`}
                  >
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          </div>

          {/* Right side - Flags and Suggestions */}
          <div className="w-80 space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-black mb-2">Flags</h3>
              <ul className="space-y-2">
                {snapshot.flags.map((flag: string) => (
                  <li key={flag} className="text-sm text-yellow-700">
                    {flag}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-black mb-2">Suggestions</h3>
              <ul className="space-y-2">
                {snapshot.suggestions.map((suggestion: string) => (
                  <li key={suggestion} className="text-sm">
                    <div className="flex items-start gap-2">
                      <Button
                        variant="ghost"
                        className={`flex-1 justify-start text-left whitespace-normal text-wrap cursor-pointer ${
                          acceptedSuggestions.includes(suggestion)
                            ? 'text-green-600'
                            : 'text-blue-700'
                        }`}
                        onClick={() => handleAcceptSuggestion(suggestion)}
                        disabled={acceptedSuggestions.includes(suggestion)}
                      >
                        {acceptedSuggestions.includes(suggestion) ? '✓ ' : ''}
                        {suggestion}
                      </Button>
                      {!acceptedSuggestions.includes(suggestion) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          className="text-xs px-2 py-1 h-7 min-w-[60px] shrink-0 cursor-pointer"
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={resetChanges}
            className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Reset Changes
          </Button>
          <Button 
            onClick={handleAuthorize}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 cursor-pointer"
          >
            Authorize Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 