'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { Project } from '@/lib/types';

type OrderMetadata = {
  orderType?: string;
  transferReference?: string;
  transferReceiptUrl?: string;
  [key: string]: unknown;
};

type OrderRow = {
  id: string;
  tx_ref: string;
  provider: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  size_id: string;
  image_code: string;
  amount_etb: number;
  payment_status: string;
  fulfillment_status: string;
  receipt_url: string | null;
  metadata: OrderMetadata;
  created_at: string;
};

type Analytics = {
  totalRevenue: number;
  volume: number;
  topAssets: Array<{ imageCode: string; count: number }>;
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
    image.onload = () =>
      resolve({ file, objectUrl, width: image.naturalWidth, height: image.naturalHeight, aspectRatio: Number((image.naturalWidth / image.naturalHeight).toFixed(4)) });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image dimensions.'));
    };
    image.src = objectUrl;
  });
}

function randomCodeBlock() {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

function createImageCode() {
  return `AA-MONO-${Date.now().toString(36).toUpperCase()}-${randomCodeBlock()}`;
}

function isManualOrder(order: OrderRow) {
  return order.provider === 'manual_transfer' || order.metadata?.orderType === 'manual_transfer';
}

export function AdminDashboard({ creatorName }: { creatorName: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ totalRevenue: 0, volume: 0, topAssets: [] });
  const [draftImage, setDraftImage] = useState<DraftImage | null>(null);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function refreshDashboard() {
    const [projectsResponse, ordersResponse, analyticsResponse] = await Promise.all([
      fetch('/api/admin/projects'),
      fetch('/api/admin/orders'),
      fetch('/api/admin/analytics')
    ]);
    const projectsPayload = (await projectsResponse.json()) as { projects?: Project[] };
    const ordersPayload = (await ordersResponse.json()) as { orders?: OrderRow[] };
    const analyticsPayload = (await analyticsResponse.json()) as { analytics?: Analytics };

    setProjects(projectsPayload.projects ?? []);
    setOrders(ordersPayload.orders ?? []);
    setAnalytics(analyticsPayload.analytics ?? { totalRevenue: 0, volume: 0, topAssets: [] });
  }

  useEffect(() => {
    void refreshDashboard();
  }, []);

  const latestOrderCount = useMemo(() => orders.filter((order) => order.fulfillment_status !== 'delivered').length, [orders]);

  async function receiveFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Select an image file.');
      return;
    }
    if (draftImage) URL.revokeObjectURL(draftImage.objectUrl);
    const imageDraft = await loadImageDimensions(file);
    setDraftImage(imageDraft);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, '').replaceAll('-', ' ').replaceAll('_', ' '));
    setNotice(`Image measured: ${imageDraft.width} × ${imageDraft.height}.`);
  }

  function uploadAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftImage || title.trim().length < 2) {
      setNotice('Select a file and enter a title.');
      return;
    }

    startTransition(async () => {
      try {
        setNotice('Uploading to portfolio bucket.');
        const supabase = getSupabaseBrowserClient();
        const imageCode = createImageCode();
        const safeName = draftImage.file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
        const path = `${imageCode}/${safeName}`;

        const { error: uploadError } = await supabase.storage.from('portfolio').upload(path, draftImage.file, {
          contentType: draftImage.file.type,
          upsert: false
        });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('portfolio').getPublicUrl(path);
        const response = await fetch('/api/admin/photographs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageCode, imageUrl: data.publicUrl, aspectRatio: draftImage.aspectRatio, title, location: 'Creator Upload', projectId })
        });
        const payload = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error ?? 'Unable to insert photograph row.');

        URL.revokeObjectURL(draftImage.objectUrl);
        setDraftImage(null);
        setTitle('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setNotice(`Uploaded live asset ${imageCode}.`);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Upload failed.');
      }
    });
  }

  async function toggleOrder(order: OrderRow) {
    const nextStatus = order.fulfillment_status === 'delivered' ? 'pending' : 'delivered';
    const response = await fetch('/api/admin/orders/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, status: nextStatus })
    });
    if (response.ok) {
      setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, fulfillment_status: nextStatus } : item)));
    }
  }

  async function approveManual(order: OrderRow) {
    const response = await fetch('/api/admin/orders/approve-manual', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.id })
    });

    if (response.ok) {
      await refreshDashboard();
    }
  }

  return (
    <aside className="fixed bottom-0 right-0 z-50 h-[92dvh] w-full overflow-y-auto border-t border-black bg-white p-4 font-mono text-[11px] uppercase tracking-[0.08em] md:top-0 md:h-dvh md:max-w-5xl md:border-l md:border-t-0">
      <header className="mb-6 flex items-center justify-between border-b border-black pb-3">
        <div>
          <p className="text-gray-500">CREATOR COMMAND DOCK</p>
          <h2 className="text-black">{creatorName}</h2>
        </div>
        <p className="text-gray-600">{latestOrderCount} PENDING</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="border border-black p-3">
          <h3 className="mb-4 border-b border-black pb-2">A / UPLOAD NEW ASSET</h3>
          <form onSubmit={uploadAsset} className="grid gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void receiveFile(event.dataTransfer.files[0]);
              }}
              className="grid min-h-36 place-items-center border border-dashed border-black bg-white p-4 text-center text-gray-600"
            >
              {draftImage ? `${draftImage.width} × ${draftImage.height} / ${draftImage.aspectRatio}` : '[ DROP PHONE FILE OR SELECT ]'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => void receiveFile(event.target.files?.[0])} />
            {draftImage ? <img src={draftImage.objectUrl} alt="Upload preview" className="w-full bg-gray-200" onContextMenu={(event) => event.preventDefault()} draggable={false} /> : null}
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="TITLE" className="border border-black bg-white p-3 outline-none" />
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="border border-black bg-white p-3 outline-none">
              <option value="">PROJECT / UNASSIGNED</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
            <button disabled={isPending} className="bg-black px-4 py-3 text-white disabled:bg-gray-500">[ PUBLISH TO WALL ]</button>
            {notice ? <p className="text-gray-600">{notice}</p> : null}
          </form>
        </section>

        <section className="border border-black p-3 lg:col-span-2">
          <h3 className="mb-4 border-b border-black pb-2">B / PAID CUSTOMERS LEDGER</h3>
          <div className="grid gap-2">
            {orders.map((order) => {
              const manualOrder = isManualOrder(order);
              const awaitingManual = manualOrder && order.payment_status !== 'paid';
              return (
                <article key={order.id} className="grid gap-2 border-b border-gray-300 pb-2 md:grid-cols-[1fr_170px]">
                  <div className="grid gap-1 text-gray-700">
                    <p className="text-black">{order.customer_name} / {order.customer_phone}</p>
                    <p>{order.delivery_address}</p>
                    <p>{order.image_code} / {order.size_id} / {new Date(order.created_at).toLocaleString()}</p>
                    {manualOrder ? (
                      <div className="mt-1 border border-black p-2 text-black">
                        <p>[ AWAITING VERIFICATION ]</p>
                        <p>REFERENCE: {order.metadata?.transferReference ?? 'NONE'}</p>
                        {order.metadata?.transferReceiptUrl ? (
                          <a href={String(order.metadata.transferReceiptUrl)} target="_blank" rel="noreferrer" className="underline">
                            [ INSPECT TRANSFER SCREENSHOT ]
                          </a>
                        ) : null}
                      </div>
                    ) : (
                      <p>GATEWAY: {order.provider} / {order.payment_status}</p>
                    )}
                  </div>
                  <div className="grid content-start gap-2">
                    {awaitingManual ? (
                      <button type="button" onClick={() => void approveManual(order)} className="bg-black px-3 py-2 text-white">
                        [ APPROVE & CONFIRM RECEIPT ]
                      </button>
                    ) : (
                      <button type="button" onClick={() => void toggleOrder(order)} className="border border-black px-3 py-2 text-black">
                        {order.fulfillment_status === 'delivered' ? '[ DELIVERED ]' : '[ PENDING ]'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
            {orders.length === 0 ? <p className="text-gray-600">NO PAID ORDERS FOUND.</p> : null}
          </div>
        </section>

        <section className="border border-black p-3 lg:col-span-3">
          <h3 className="mb-4 border-b border-black pb-2">C / ITEMS SOLD ANALYTICS</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <p className="bg-black p-4 text-white">TOTAL REVENUE: {analytics.totalRevenue.toLocaleString()} ETB</p>
            <p className="border border-black p-4">VOLUME SOLD: {analytics.volume}</p>
            <div className="border border-black p-4">
              <p className="mb-2">TOP PERFORMING ASSETS</p>
              {analytics.topAssets.map((asset) => <p key={asset.imageCode}>{asset.imageCode} / {asset.count}</p>)}
              {analytics.topAssets.length === 0 ? <p className="text-gray-600">NO SALES DATA.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}
