'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { logEvent } from '@/lib/ledger';
import { FileType } from '@/lib/types';

const ACCEPT = '.csv,.xlsx,.pdf,.sdf,.fasta';
const ALLOWED_EXTENSIONS = ['csv', 'xlsx', 'pdf', 'sdf', 'fasta'];

export function extensionToFileType(name: string): FileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'csv':
      return 'CSV';
    case 'xlsx':
      return 'XLSX';
    case 'pdf':
      return 'PDF';
    case 'fasta':
      return 'FASTA';
    default:
      return 'SDF';
  }
}

interface UploadDropzoneProps {
  onUploaded?: (file: { name: string; type: FileType }) => void;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; name: string }
  | { status: 'done'; name: string }
  | { status: 'unpersisted'; name: string }
  | { status: 'error'; message: string };

export default function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setState({
        status: 'error',
        message: `Unsupported file type ".${ext}". Supported: CSV, XLSX, PDF, SDF, FASTA.`,
      });
      return;
    }

    const supabase = getSupabase();

    if (!supabase) {
      setState({ status: 'unpersisted', name: file.name });
      onUploaded?.({ name: file.name, type: extensionToFileType(file.name) });
      void logEvent({ actor: 'User', action: 'Uploaded dataset', subject: file.name });
      return;
    }

    setState({ status: 'uploading', name: file.name });
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('datasets')
        .upload(path, file);
      if (storageError) throw new Error(storageError.message);

      const { error: insertError } = await supabase.from('datasets').insert({
        name: file.name,
        file_path: path,
        file_type: ext,
        size_bytes: file.size,
      });
      if (insertError) throw new Error(insertError.message);

      onUploaded?.({ name: file.name, type: extensionToFileType(file.name) });
      void logEvent({ actor: 'User', action: 'Uploaded dataset', subject: file.name });
      setState({ status: 'done', name: file.name });
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Upload failed.',
      });
    }
  };

  const configured = getSupabase() !== null;

  return (
    <div className="flex-1 flex flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer transition-colors min-h-[100px]"
        style={{
          borderColor: dragging ? 'var(--cyan)' : 'var(--line)',
          background: dragging ? 'var(--cyan-soft)' : 'transparent',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        {state.status === 'uploading' ? (
          <>
            <Loader2 size={20} className="mb-2 animate-spin" style={{ color: 'var(--cyan)' }} />
            <p className="text-xs text-center" style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}>
              Uploading {state.name}…
            </p>
          </>
        ) : (
          <>
            <Upload size={20} style={{ color: 'var(--faint)' }} className="mb-2" />
            <p className="text-xs text-center" style={{ color: 'var(--slate)', fontFamily: 'var(--font-inter)' }}>
              Drag and drop files here, or click to browse
            </p>
            <p className="text-[10px] text-center mt-1" style={{ color: 'var(--faint)' }}>
              Supported: CSV, XLSX, PDF, SDF, FASTA
            </p>
          </>
        )}
      </div>

      {state.status === 'done' && (
        <p className="text-xs mt-2" style={{ color: 'var(--green)', fontFamily: 'var(--font-inter)' }}>
          {state.name} uploaded.
        </p>
      )}
      {state.status === 'unpersisted' && (
        <p className="text-xs mt-2" style={{ color: 'var(--amber)', fontFamily: 'var(--font-inter)' }}>
          {state.name}: Supabase not configured — file not persisted
        </p>
      )}
      {state.status === 'error' && (
        <p className="text-xs mt-2" style={{ color: 'var(--red)', fontFamily: 'var(--font-inter)' }}>
          {state.message}
        </p>
      )}
      {!configured && state.status === 'idle' && (
        <p className="text-[10px] mt-2" style={{ color: 'var(--faint)', fontFamily: 'var(--font-inter)' }}>
          Connect Supabase to enable uploads
        </p>
      )}
    </div>
  );
}
