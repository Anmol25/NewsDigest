import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

const SharePopup: React.FC<SharePopupProps> = ({ isOpen, onClose, url, title }) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch (err) {
      const temp = document.createElement('input');
      temp.value = url;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
      setCopied(true);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || 'Check this out');

  const links = [
    { name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, icon: 'ri-twitter-x-line' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: 'ri-facebook-fill' },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: 'ri-linkedin-fill' },
    { name: 'Reddit', href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`, icon: 'ri-reddit-line' },
    { name: 'WhatsApp', href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, icon: 'ri-whatsapp-line' },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`, icon: 'ri-telegram-line' },
    { name: 'Email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, icon: 'ri-mail-line' },
  ];

  const onBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const shareViaDevice = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'News', url });
        onClose();
      } catch (_) {
        // user cancelled
      }
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[1px]"
      onClick={onBackgroundClick}
    >
      <div
        ref={containerRef}
        className="w-full sm:w-[520px] max-w-[92vw] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 animate-slide-up sm:animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Share this news</h3>
            {title && <p className="text-sm text-gray-500 line-clamp-2">{title}</p>}
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-2">
          <div className="flex-1 overflow-hidden">
            <input
              readOnly
              value={url}
              className="w-full bg-transparent text-sm text-gray-800 outline-none truncate"
              aria-label="Share URL"
            />
          </div>
          <button
            onClick={copyToClipboard}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg cursor-pointer transition ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
          >
            <i className={`ri-file-copy-line text-base ${copied ? 'text-emerald-700' : ''}`} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {typeof navigator !== 'undefined' && (navigator as any).share && (
          <button
            onClick={shareViaDevice}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 cursor-pointer bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm hover:bg-black transition"
          >
            <i className="ri-share-forward-line text-base" /> Share via device
          </button>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {links.map(({ name, href, icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(onClose, 150)}
              className="group flex items-center gap-2 border border-gray-200 rounded-xl p-2 hover:bg-gray-50 transition"
            >
              <i className={`${icon} text-[18px] text-gray-700 group-hover:text-black`} />
              <span className="text-sm text-gray-800 group-hover:text-black">{name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default SharePopup;
