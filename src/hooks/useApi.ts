import { useQuery } from '@tanstack/react-query';
import {
  getMetrics,
  getTemplates,
  getBrokers,
  getSenders,
  getGoals,
  getFunds,
  getChallenges,
  getNotifications,
  getProfile,
} from '../services/rustApi';

export function useMetrics() {
  return useQuery<any>({
    queryKey: ['metrics'],
    queryFn: () => getMetrics(),
  });
}

export function useTemplates() {
  return useQuery<any[]>({
    queryKey: ['templates'],
    queryFn: () => getTemplates(),
  });
}

export function useBrokers() {
  return useQuery<any[]>({
    queryKey: ['brokers'],
    queryFn: () => getBrokers(),
  });
}

export function useSenders() {
  return useQuery<any[]>({
    queryKey: ['senders'],
    queryFn: () => getSenders(),
  });
}

export function useGoals() {
  return useQuery<any[]>({
    queryKey: ['goals'],
    queryFn: () => getGoals(),
  });
}

export function useFunds() {
  return useQuery<any[]>({
    queryKey: ['funds'],
    queryFn: () => getFunds(),
  });
}

export function useChallenges() {
  return useQuery<any[]>({
    queryKey: ['challenges'],
    queryFn: () => getChallenges(),
  });
}

export function useNotifications() {
  return useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
  });
}

export function useProfile() {
  return useQuery<any>({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });
}
