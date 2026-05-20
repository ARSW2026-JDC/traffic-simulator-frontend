import { describe, it, expect } from 'vitest';
import { actionFromField } from './HistoryPanel';

describe('actionFromField', () => {
  it('returns "add" for "created"', () => {
    expect(actionFromField('created')).toBe('add');
  });

  it('returns "delete" for "deleted"', () => {
    expect(actionFromField('deleted')).toBe('delete');
  });

  it('returns "modify" for undefined field', () => {
    expect(actionFromField(undefined)).toBe('modify');
  });

  it('returns "modify" for unknown field', () => {
    expect(actionFromField('someOtherField')).toBe('modify');
  });
});
