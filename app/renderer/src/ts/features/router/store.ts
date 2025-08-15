import { writable } from 'svelte/store';
import type { Route } from './types';

export const currentRoute = writable<Route>('home');


