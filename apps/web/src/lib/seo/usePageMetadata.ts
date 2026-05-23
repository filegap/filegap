import { useEffect } from 'react';

type PageMetadata = {
  title: string;
  description: string;
  canonicalPath?: string | null;
  robots?: string | null;
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function normalizeCanonicalPath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function upsertCanonical(href: string): void {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'canonical');
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function removeCanonical(): void {
  document.head.querySelector('link[rel="canonical"]')?.remove();
}

function removeMeta(attribute: 'name' | 'property', key: string): void {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

export function usePageMetadata({ title, description, canonicalPath, robots }: PageMetadata): void {
  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);

    if (robots === null || robots === undefined) {
      removeMeta('name', 'robots');
    } else {
      upsertMeta('name', 'robots', robots);
    }

    if (canonicalPath === null) {
      removeCanonical();
      return;
    }

    const path = canonicalPath ?? window.location.pathname;
    const canonicalUrl = new URL(normalizeCanonicalPath(path), window.location.origin);
    upsertCanonical(canonicalUrl.toString());
  }, [canonicalPath, description, robots, title]);
}
