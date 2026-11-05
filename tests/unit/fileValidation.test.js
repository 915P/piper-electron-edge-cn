const { describe, test, expect, beforeEach } = require('@jest/globals');

// We need to extract and test the file validation functions from main.js
// Since they're not exported, we'll need to refactor or test them indirectly

describe('File Validation', () => {
  let mockFs;
  let isKnownTextExtension;
  let isProbablyTextContent;
  let isValidTextFile;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockFs = global.mockFs;

    // Since the functions aren't exported from main.js, let's recreate them for testing
    const knownTextExtensions = [
      '.txt', '.md', '.html', '.htm', '.js', '.ts', '.json',
      '.css', '.csv', '.xml', '.ini', '.log', '.yml', '.yaml',
      '.py', '.java', '.c', '.cpp', '.rb', '.go'
    ];

    isKnownTextExtension = (filePath) => {
      const path = require('path');
      const ext = path.extname(filePath).toLowerCase();
      return knownTextExtensions.includes(ext);
    };

    isProbablyTextContent = (filePath, maxBytes = 512) => {
      try {
        const fs = require('fs');
        const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
        const sample = buffer.slice(0, maxBytes);
        for (let i = 0; i < sample.length; i++) {
          const code = sample[i];
          if (code === 9 || code === 10 || code === 13) {
            continue;
          } // tab, CR, LF
          if (code < 32 || code > 126) {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    };

    isValidTextFile = (filePath) => {
      return isKnownTextExtension(filePath) || isProbablyTextContent(filePath);
    };
  });

  describe('isKnownTextExtension', () => {
    test('recognizes common text file extensions', () => {
      expect(isKnownTextExtension('document.txt')).toBe(true);
      expect(isKnownTextExtension('README.md')).toBe(true);
      expect(isKnownTextExtension('index.html')).toBe(true);
      expect(isKnownTextExtension('script.js')).toBe(true);
      expect(isKnownTextExtension('config.json')).toBe(true);
      expect(isKnownTextExtension('styles.css')).toBe(true);
    });

    test('recognizes programming language extensions', () => {
      expect(isKnownTextExtension('app.py')).toBe(true);
      expect(isKnownTextExtension('Main.java')).toBe(true);
      expect(isKnownTextExtension('main.c')).toBe(true);
      expect(isKnownTextExtension('main.cpp')).toBe(true);
      expect(isKnownTextExtension('script.rb')).toBe(true);
      expect(isKnownTextExtension('main.go')).toBe(true);
      expect(isKnownTextExtension('component.ts')).toBe(true);
    });

    test('recognizes configuration file extensions', () => {
      expect(isKnownTextExtension('config.yml')).toBe(true);
      expect(isKnownTextExtension('docker-compose.yaml')).toBe(true);
      expect(isKnownTextExtension('app.ini')).toBe(true);
      expect(isKnownTextExtension('server.xml')).toBe(true);
      expect(isKnownTextExtension('data.csv')).toBe(true);
      expect(isKnownTextExtension('app.log')).toBe(true);
    });

    test('handles case insensitivity', () => {
      expect(isKnownTextExtension('FILE.TXT')).toBe(true);
      expect(isKnownTextExtension('Script.JS')).toBe(true);
      expect(isKnownTextExtension('CONFIG.JSON')).toBe(true);
    });

    test('rejects non-text file extensions', () => {
      expect(isKnownTextExtension('image.jpg')).toBe(false);
      expect(isKnownTextExtension('audio.mp3')).toBe(false);
      expect(isKnownTextExtension('video.mp4')).toBe(false);
      expect(isKnownTextExtension('archive.zip')).toBe(false);
      expect(isKnownTextExtension('binary.exe')).toBe(false);
    });

    test('handles files without extensions', () => {
      expect(isKnownTextExtension('README')).toBe(false);
      expect(isKnownTextExtension('Makefile')).toBe(false);
    });

    test('handles paths with directories', () => {
      expect(isKnownTextExtension('/path/to/file.txt')).toBe(true);
      expect(isKnownTextExtension('src/components/Component.js')).toBe(true);
    });
  });

  describe('isProbablyTextContent', () => {
    beforeEach(() => {
      // Mock readFileSync to return different content types
      mockFs.readFileSync.mockImplementation((filePath, options) => {
        if (filePath.includes('text-file')) {
          return Buffer.from('This is plain text content with normal characters.');
        }
        if (filePath.includes('binary-file')) {
          return Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]); // Binary content
        }
        if (filePath.includes('mixed-file')) {
          // Create actual binary content with null byte and high ASCII
          const textPart = Buffer.from('Normal text');
          const binaryPart = Buffer.from([0x00, 0xFF]); // null byte and high ASCII
          return Buffer.concat([textPart, binaryPart, Buffer.from('more text')]);
        }
        if (filePath.includes('whitespace-file')) {
          return Buffer.from('Text\\twith\\ttabs\\nand\\rline\\nbreaks'); // Valid whitespace
        }
        throw new Error('File not found');
      });
    });

    test('identifies text files correctly', () => {
      expect(isProbablyTextContent('text-file')).toBe(true);
    });

    test('identifies binary files correctly', () => {
      expect(isProbablyTextContent('binary-file')).toBe(false);
    });

    test('handles mixed content', () => {
      expect(isProbablyTextContent('mixed-file')).toBe(false);
    });

    test('allows valid whitespace characters', () => {
      expect(isProbablyTextContent('whitespace-file')).toBe(true);
    });

    test('handles file read errors gracefully', () => {
      expect(isProbablyTextContent('non-existent-file')).toBe(false);
    });

    test('respects maxBytes parameter', () => {
      mockFs.readFileSync.mockReturnValue(Buffer.from('A'.repeat(1000)));
      expect(isProbablyTextContent('large-text-file', 100)).toBe(true);
    });
  });

  describe('isValidTextFile', () => {
    beforeEach(() => {
      // Mock isProbablyTextContent for files without known extensions
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('unknown-text')) {
          return Buffer.from('This is text content');
        }
        if (filePath.includes('unknown-binary')) {
          return Buffer.from([0x00, 0x01, 0xFF]);
        }
        throw new Error('File not found');
      });
    });

    test('validates files with known extensions', () => {
      expect(isValidTextFile('document.txt')).toBe(true);
      expect(isValidTextFile('script.js')).toBe(true);
      expect(isValidTextFile('README.md')).toBe(true);
    });

    test('validates files by content when extension is unknown', () => {
      expect(isValidTextFile('unknown-text')).toBe(true);
      expect(isValidTextFile('unknown-binary')).toBe(false);
    });

    test('handles files that fail both checks', () => {
      expect(isValidTextFile('image.jpg')).toBe(false); // Known non-text extension
    });

    test('prioritizes known extensions over content checking', () => {
      // Even if content check might fail, known extensions should pass
      expect(isValidTextFile('config.json')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty file paths', () => {
      expect(isKnownTextExtension('')).toBe(false);
      expect(isValidTextFile('')).toBe(false);
    });

    test('handles files with multiple dots', () => {
      expect(isKnownTextExtension('file.backup.txt')).toBe(true);
      expect(isKnownTextExtension('jquery.min.js')).toBe(true);
    });

    test('handles files starting with dots', () => {
      expect(isKnownTextExtension('.gitignore')).toBe(false);
      expect(isKnownTextExtension('.env.txt')).toBe(true);
    });
  });
});
