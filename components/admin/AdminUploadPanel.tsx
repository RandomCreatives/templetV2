'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { createPhotographUpload } from '@/app/admin/upload/actions';
import type { Photograph, Project } from '@/lib/types';

type AdminUploadPanelProps = {
  projects: Project[];
};

type DraftImage = {
  file: File;
  objectUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
};

function loadImageDimensions(file: File) {
  return new Promise<DraftImage>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      resolve({
        file,
        objectUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
        aspectRatio: Number((image.naturalWidth / image.naturalHeight).toFixed(4))
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image dimensions.'));
    };

    image.src = objectUrl;
  });
}

export function AdminUploadPanel({ projects }: AdminUploadPanelProps) {
  const [draftImage, setDraftImage] = useState<DraftImage | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [isPrintAvailable, setIsPrintAvailable] = useState(true);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photograph[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const latestJson = useMemo(() => JSON.stringify(uploadedPhotos, null, 2), [uploadedPhotos]);

  async function receiveFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Select an image file.');
      return;
    }

    if (draftImage) URL.revokeObjectURL(draftImage.objectUrl);

    try {
      const imageDraft = await loadImageDimensions(file);
      setDraftImage(imageDraft);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replaceAll('-', ' ').replaceAll('_', ' '));
      setNotice(`Image measured: ${imageDraft.width} × ${imageDraft.height}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to process image.');
    }
  }

  function submitUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draftImage) {
      setNotice('Select an image before submitting.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedLocation = location.trim();

    if (trimmedTitle.length < 2 || trimmedLocation.length < 2) {
      setNotice('Title and location are required.');
      return;
    }

    const formData = new FormData();
    formData.append('file', draftImage.file);
    formData.append('title', trimmedTitle);
    formData.append('location', trimmedLocation);
    formData.append('projectId', projectId);
    formData.append('aspectRatio', String(draftImage.aspectRatio));
    formData.append('isPrintAvailable', String(isPrintAvailable));

    startTransition(async () => {
      setNotice('Writing image and metadata to Supabase.');
      const result = await createPhotographUpload(formData);

      if (!result.ok) {
        setNotice(result.error);
        return;
      }

      setUploadedPhotos((current) => [result.photo, ...current]);
      URL.revokeObjectURL(draftImage.objectUrl);
      setDraftImage(null);
      setTitle('');
      setLocation('');
      setIsPrintAvailable(true);
      setNotice(`Live Supabase record created: ${result.photo.imageCode}.`);

      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  }

  return (
    <main className="mx-auto max-w-[1400px] px-3 py-4 md:px-5">
      <header className="mb-6 flex items-end justify-between border-b border-black pb-3 font-mono text-[10px] uppercase tracking-[0.12em]">
        <h1>LIVE SUPABASE INGEST</h1>
        <p className="text-gray-500">FILES WRITE TO STORAGE + DATABASE</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submitUpload} className="grid content-start gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void receiveFile(event.dataTransfer.files[0]);
            }}
            className="grid min-h-48 place-items-center border border-dashed border-black bg-white p-6 text-center text-gray-600"
            disabled={isPending}
          >
            {draftImage ? (
              <span>
                {draftImage.file.name}
                <br />
                {draftImage.width} × {draftImage.height} / RATIO {draftImage.aspectRatio}
              </span>
            ) : (
              <span>[ DROP IMAGE OR SELECT FILE ]</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={(event) => void receiveFile(event.target.files?.[0])}
          />

          {draftImage ? (
            <img
              src={draftImage.objectUrl}
              alt="Selected upload preview"
              onContextMenu={(event) => event.preventDefault()}
              className="w-full select-none bg-gray-200"
              draggable={false}
            />
          ) : null}

          <label className="grid gap-1">
            TITLE
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="border border-black bg-white p-3 outline-none" disabled={isPending} />
          </label>
          <label className="grid gap-1">
            LOCATION
            <input value={location} onChange={(event) => setLocation(event.target.value)} className="border border-black bg-white p-3 outline-none" disabled={isPending} />
          </label>
          <label className="grid gap-1">
            PROJECT / BOARD
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="border border-black bg-white p-3 outline-none" disabled={isPending}>
              <option value="">UNASSIGNED</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between border border-black p-3">
            PRINT AVAILABLE
            <input checked={isPrintAvailable} onChange={(event) => setIsPrintAvailable(event.target.checked)} type="checkbox" disabled={isPending} />
          </label>
          <button type="submit" className="bg-black px-5 py-3 text-white disabled:bg-gray-500" disabled={isPending}>
            {isPending ? '[ WRITING TO SUPABASE ]' : '[ INGEST LIVE RECORD ]'}
          </button>
          {notice ? <p className="text-gray-600">{notice}</p> : null}
        </form>

        <section className="grid content-start gap-6">
          <div>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em]">LIVE SESSION WRITES</h2>
            <div className="columns-2 gap-3 md:columns-3">
              {uploadedPhotos.map((photo) => (
                <figure key={photo.id} className="mb-4 break-inside-avoid">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full select-none bg-gray-200"
                    onContextMenu={(event) => event.preventDefault()}
                    draggable={false}
                  />
                  <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-gray-500">
                    {photo.location} / {photo.imageCode}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em]">INSERTED OBJECTS</h2>
            <pre className="max-h-[420px] overflow-auto border border-black p-3 text-[11px] leading-relaxed text-gray-700">
              {uploadedPhotos.length ? latestJson : '[]'}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
