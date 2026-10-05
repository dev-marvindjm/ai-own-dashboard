import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'win' || s === 'buy' || s === 'connected' || s === 'success' || s === 'passed') {
    return 'text-green-500 bg-green-500/10 border-green-500/20';
  }
  if (s === 'loss' || s === 'sell' || s === 'blocked' || s === 'failed' || s === 'disconnected' || s === 'error') {
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  }
  if (s === 'pending' || s === 'warning') {
    return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  }
  if (s === 'info' || s === 'processing') {
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }
  return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
}
