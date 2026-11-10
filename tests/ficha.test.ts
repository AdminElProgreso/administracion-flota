import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, docStatus, vehicleDocs } from '../supabase/functions/_shared/alerts';
import { displayPrefs } from '../lib/display';
import { docFromSearch, hasUrgentDoc, isUrgentDoc, orderDocs } from '../lib/ficha';
import { T, vehicle } from './fixtures';

describe('ficha: del aviso al documento', () => {
  it('lee el documento de la dirección', () => {
    expect(docFromSearch('?doc=VTV')).toBe('VTV');
    expect(docFromSearch('?doc=Seguro&x=1')).toBe('Seguro');
    expect(docFromSearch('?doc=vtv')).toBeNull();
    expect(docFromSearch('?doc=Otro')).toBeNull();
    expect(docFromSearch('')).toBeNull();
  });
  it('ordena por urgencia y respeta el orden de siempre en empates', () => {
    const docs = vehicleDocs(vehicle('a', { patente_expiration: '2026-10-01', insurance_expiration: '2027-06-01' }), displayPrefs(DEFAULT_PREFS), T);
    expect(orderDocs(docs).map(d => d.type)).toEqual(['Patente', 'VTV', 'Seguro']);
    expect(docs.map(d => d.type)).toEqual(['Seguro', 'VTV', 'Patente']);
    expect(hasUrgentDoc(docs)).toBe(true);
    expect(hasUrgentDoc(vehicleDocs(vehicle('b'), DEFAULT_PREFS, T))).toBe(false);
  });
  it('un turno para hoy también es urgente, uno futuro no', () => {
    const doc = (appt: string) => docStatus('VTV', '2026-10-01', appt, 30, T);
    expect(isUrgentDoc(doc(T))).toBe(true);
    expect(isUrgentDoc(doc('2026-11-20'))).toBe(false);
    expect(isUrgentDoc(docStatus('VTV', '2027-06-01', null, 30, T))).toBe(false);
    expect(isUrgentDoc(docStatus('VTV', '2026-11-10', null, 30, T))).toBe(true);
    expect(hasUrgentDoc([doc(T)])).toBe(true);
  });
  it('un empate conserva el orden original', () => {
    const docs = vehicleDocs(vehicle('c'), displayPrefs(DEFAULT_PREFS), T);
    expect(orderDocs(docs).map(d => d.type)).toEqual(docs.map(d => d.type));
  });
});
