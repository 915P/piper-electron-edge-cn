const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock DOM before importing the module
beforeEach(() => {
  setupDOM();
});

// Import the module after DOM setup
const utils = require('../../scripts/utils.js');

describe('Utils Module', () => {
  describe('formatDuration', () => {
    test('formats seconds correctly', () => {
      expect(utils.formatDuration(30)).toBe('30.0 seconds');
      expect(utils.formatDuration(45.5)).toBe('45.5 seconds');
    });

    test('formats minutes and seconds correctly', () => {
      expect(utils.formatDuration(90)).toBe('1:30');
      expect(utils.formatDuration(150)).toBe('2:30');
    });

    test('formats hours, minutes, and seconds correctly', () => {
      expect(utils.formatDuration(3661)).toBe('1:01:01');
      expect(utils.formatDuration(7200)).toBe('2:00:00');
      expect(utils.formatDuration(3723)).toBe('1:02:03');
    });

    test('handles zero duration', () => {
      expect(utils.formatDuration(0)).toBe('0.0 seconds');
    });

    test('handles edge cases', () => {
      expect(utils.formatDuration(60)).toBe('1:00');
      expect(utils.formatDuration(3600)).toBe('1:00:00');
    });
  });

  describe('updateEstimatedDuration', () => {
    beforeEach(() => {
      setupDOM();
      // Set up text input with sample text
      document.getElementById('textInput').value = '';
      document.getElementById('durationEstimate').textContent = '';
    });

    test('calculates duration for empty text', () => {
      document.getElementById('textInput').value = '';
      utils.updateEstimatedDuration();

      expect(document.getElementById('durationEstimate').textContent)
        .toBe('Estimated Duration (WPM): 0.0 secondss');
    });

    test('calculates duration for short text', () => {
      // 4 words should take about 1.5 seconds at 160 WPM
      document.getElementById('textInput').value = 'This is sample text';
      utils.updateEstimatedDuration();

      const durationText = document.getElementById('durationEstimate').textContent;
      expect(durationText).toContain('Estimated Duration (WPM):');
      expect(durationText).toContain('seconds');
    });

    test('calculates duration for longer text', () => {
      // 160 words should take about 60 seconds at 160 WPM
      const longText = Array(160).fill('word').join(' ');
      document.getElementById('textInput').value = longText;
      utils.updateEstimatedDuration();

      const durationText = document.getElementById('durationEstimate').textContent;
      expect(durationText).toContain('Estimated Duration (WPM):');
      expect(durationText).toContain('1:00');
    });

    test('handles text with multiple spaces and line breaks', () => {
      document.getElementById('textInput').value = 'This   has    multiple\\n\\nspaces  and   breaks';
      utils.updateEstimatedDuration();

      const durationText = document.getElementById('durationEstimate').textContent;
      expect(durationText).toContain('Estimated Duration (WPM):');
      // Should count 6 words despite multiple spaces
    });

    test('updates the correct DOM element', () => {
      document.getElementById('textInput').value = 'Test text';
      utils.updateEstimatedDuration();

      const element = document.getElementById('durationEstimate');
      expect(element.textContent).not.toBe('');
      expect(element.textContent).toContain('Estimated Duration (WPM):');
    });
  });
});
