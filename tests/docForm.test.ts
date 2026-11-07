import { describe, it, expect } from 'vitest';
import { currentExpiryNote, appointmentNote, appointmentProposal, dateError, renewProposal, renewedMessage } from '../lib/docForm';

import { T } from './fixtures';

describe('hoja de documentos', () => {
  it('muestra la fecha que tenía el documento', () => {
    expect(currentExpiryNote(null, T)).toBeNull();
    expect(currentExpiryNote('2026-12-01', T)).toBe('Vence el 01/12/2026');
    expect(currentExpiryNote('2026-10-01', T)).toBe('Venció el 01/10/2026');
  });
  it('propone renovar un año desde el vencimiento, o desde hoy si ya venció', () => {
    expect(renewProposal('2026-12-10', '2026-11-04')).toBe('2027-12-10');
    expect(renewProposal('2026-10-01', '2026-11-04')).toBe('2027-11-04');
    expect(renewProposal(null, '2026-11-04')).toBe('2027-11-04');
  });
  it('propone el turno cargado si todavía no pasó, si no hoy', () => {
    expect(appointmentProposal('2026-11-10', '2026-11-04')).toBe('2026-11-10');
    expect(appointmentProposal('2026-11-04', '2026-11-04')).toBe('2026-11-04');
    expect(appointmentProposal('2026-11-01', '2026-11-04')).toBe('2026-11-04');
    expect(appointmentProposal(null, '2026-11-04')).toBe('2026-11-04');
  });
  it('aviso de renovación con el género del documento', () => {
    expect(renewedMessage('Seguro', '2027-11-04')).toBe('Seguro renovado hasta el 04/11/2027');
    expect(renewedMessage('VTV', '2027-11-04')).toBe('VTV renovada hasta el 04/11/2027');
    expect(renewedMessage('Patente', '2027-11-04')).toBe('Patente renovada hasta el 04/11/2027');
  });
  it('primera fecha de un documento que no tenía', () => {
    expect(renewedMessage('Seguro', '2027-11-04', false)).toBe('Vencimiento del seguro cargado: 04/11/2027');
    expect(renewedMessage('VTV', '2027-11-04', false)).toBe('Vencimiento de la VTV cargado: 04/11/2027');
    expect(renewedMessage('Patente', '2027-11-04', false)).toBe('Vencimiento de la patente cargado: 04/11/2027');
  });
  it('pide una fecha y no acepta un turno en el pasado', () => {
    expect(dateError('renew', '', '2026-11-04')).toBe('Elegí una fecha');
    expect(dateError('appointment', '', '2026-11-04')).toBe('Elegí una fecha');
    expect(dateError('appointment', '2026-11-03', '2026-11-04')).toBe('El turno tiene que ser de hoy en adelante');
    expect(dateError('appointment', '2026-11-04', '2026-11-04')).toBeNull();
    // Renewing to a past date fixes a wrong expiration
    expect(dateError('renew', '2026-11-03', '2026-11-04')).toBeNull();
  });
  it('explica qué pasa con los avisos mientras hay turno', () => {
    expect(appointmentNote(7, true)).toBe('Mientras el turno esté cargado no llegan avisos de vencimiento: te recordamos el turno 7 días antes.');
    expect(appointmentNote(1, true)).toBe('Mientras el turno esté cargado no llegan avisos de vencimiento: te recordamos el turno 1 día antes.');
    expect(appointmentNote(7, false)).toBe('Mientras el turno esté cargado no llegan avisos de vencimiento.');
  });
});
