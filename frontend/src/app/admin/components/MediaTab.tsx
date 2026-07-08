'use client';

import React, { useState, useEffect } from 'react';
import {
  Folder,
  Image as ImageIcon,
  Trash2,
  Plus,
  Upload,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import api from '@/lib/api';
import { useToastStore } from '@/store/toastStore';

export default function MediaTab() {
  const { addToast } = useToastStore();
  const [activeFolder, setActiveFolder] = useState('products');
  const [files, setFiles] = useState<
    { name: string; size: number; url: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const foldersList = ['products', 'categories', 'offers', 'banners'];

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/media?folder=${activeFolder}`);
      setFiles(response.data);
    } catch (err) {
      console.error(err);
      addToast('Could not fetch folder contents.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeFolder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/admin/media/upload?folder=${activeFolder}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('File uploaded to media directory!', 'success');
      fetchFiles();
    } catch (err) {
      console.error(err);
      addToast('Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      await api.delete(`/admin/media?folder=${activeFolder}&filename=${filename}`);
      addToast('File deleted.', 'info');
      fetchFiles();
    } catch (err) {
      console.error(err);
      addToast('Delete failed.', 'error');
    }
  };

  const handleCopyUrl = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    addToast('URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-red-500" /> Media Library
          </h2>
          <p className="text-xs text-foreground mt-1">
            Review static assets, organize banner campaigns, and upload mock product images.
          </p>
        </div>

        {/* Upload Trigger */}
        <div className="relative">
          <input
            type="file"
            id="media-uploader"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <label
            htmlFor="media-uploader"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition-transform active:scale-95"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span>Upload Image</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-xs font-semibold text-foreground">
        {/* Folders List */}
        <div className="lg:col-span-1 space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-foreground font-extrabold block mb-1">
            Library Folders
          </span>
          {foldersList.map((folder) => {
            const isSelected = activeFolder === folder;
            return (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all capitalize cursor-pointer text-left ${isSelected
                  ? 'bg-card text-red-500 border border-red-500/25 font-bold shadow'
                  : 'bg-card/40 border border-neutral-300/50 hover:bg-card text-foreground hover:text-primary'
                  }`}
              >
                <Folder className="h-4 w-4 text-foreground" />
                <span>{folder}</span>
              </button>
            );
          })}
        </div>

        {/* Files Grid preview */}
        <div className="lg:col-span-3 bg-card/30 border border-neutral-900/60 p-6 rounded-3xl min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-foreground">
              Loading folder contents...
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-foreground space-y-2 border border-dashed border-neutral-300/50 rounded-2xl">
              <ImageIcon className="h-8 w-8 text-neutral-700" />
              <span className="text-xs font-bold uppercase tracking-wider">
                No files in directory
              </span>
              <span className="text-[10px] text-foreground">
                Select another folder or upload files.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-background border border-neutral-300/50 rounded-2xl flex flex-col items-center gap-3 group relative hover:border-neutral-750 transition-colors"
                >
                  {/* Visual Preview */}
                  <div className="h-28 w-full bg-card border border-neutral-300/50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative">
                    <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                  </div>

                  {/* Info details */}
                  <div className="w-full text-center space-y-1">
                    <span className="text-[10px] font-bold text-foreground block truncate">
                      {file.name}
                    </span>
                    <span className="text-[8px] font-semibold text-foreground block">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  {/* Actions overlay */}
                  <div className="flex gap-2 w-full pt-1.5 border-t border-neutral-900 justify-center">
                    <button
                      onClick={() => handleCopyUrl(file.url, idx)}
                      className="p-1.5 rounded-lg bg-card border border-neutral-300/50 text-foreground hover:text-primary cursor-pointer inline-flex"
                      title="Copy URL"
                    >
                      {copiedIndex === idx ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(file.name)}
                      className="p-1.5 rounded-lg bg-card border border-neutral-300/50 text-foreground hover:text-red-500 cursor-pointer inline-flex"
                      title="Delete Image"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
