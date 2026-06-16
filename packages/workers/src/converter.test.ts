import { describe, it, expect } from 'vitest';
import {
  convertMarkdownToText,
  convertMarkdownToHtml,
  convertMarkdownToCsv,
  convertCsvToText,
  convertCsvToMarkdown,
  convertCsvToCsv,
  convertTxtToMarkdown,
  convertTxtToCsv,
  convertMermaidToHtml,
  convertMermaidToCsv,
  convertMarkdownToLatex,
  convertCsvToLatex,
  convertTxtToLatex,
  convertLatexToMarkdown,
  convertLatexToText,
  convertLatexToHtml,
} from './converter';

describe('Markdown conversions', () => {
  describe('Markdown → Text', () => {
    it('strips basic markdown formatting', () => {
      const input = '# Hello World\n\nThis is **bold** and *italic* text.\n\n- Item 1\n- Item 2';
      const result = convertMarkdownToText(input);
      expect(result).toContain('HELLO WORLD');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).toContain('Item 1');
      // Should not contain markdown syntax
      expect(result).not.toContain('**');
    });

    it('handles empty input', () => {
      expect(convertMarkdownToText('').trim()).toBe('');
    });

    it('preserves plain text', () => {
      const input = 'Just plain text without any formatting.';
      const result = convertMarkdownToText(input);
      expect(result).toContain('Just plain text without any formatting.');
    });
  });

  describe('Markdown → HTML', () => {
    it('converts headings', () => {
      const result = convertMarkdownToHtml('# Heading 1\n\n## Heading 2\n\n### Heading 3');
      expect(result).toContain('<h1');
      expect(result).toContain('Heading 1');
      expect(result).toContain('<h2');
      expect(result).toContain('Heading 2');
      expect(result).toContain('<h3');
      expect(result).toContain('Heading 3');
    });

    it('converts bold and italic', () => {
      const result = convertMarkdownToHtml('**bold** and *italic*');
      expect(result).toContain('<strong>bold</strong>');
      expect(result).toContain('<em>italic</em>');
    });

    it('converts code blocks', () => {
      const result = convertMarkdownToHtml('```js\nconst x = 1;\n```');
      expect(result).toContain('<code');
      expect(result).toContain('const x = 1;');
    });

    it('handles empty input', () => {
      const result = convertMarkdownToHtml('');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Markdown → CSV', () => {
    it('converts tables to CSV', () => {
      const input = '| Name | Age |\n|------|-----|\n| Alice | 30 |\n| Bob | 25 |';
      const result = convertMarkdownToCsv(input);
      expect(result).toContain('Name');
      expect(result).toContain('Age');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('handles text without tables', () => {
      const result = convertMarkdownToCsv('Hello world');
      expect(typeof result).toBe('string');
    });
  });

  describe('Markdown → LaTeX', () => {
    it('converts headings to LaTeX sections', () => {
      const result = convertMarkdownToLatex('# Section Title');
      expect(result).toContain('\\section');
      expect(result).toContain('Section Title');
    });

    it('converts bold to LaTeX', () => {
      const result = convertMarkdownToLatex('**bold text**');
      expect(result).toContain('\\textbf');
      expect(result).toContain('bold text');
    });

    it('converts italic to LaTeX', () => {
      const result = convertMarkdownToLatex('*italic text*');
      expect(result).toContain('\\textit');
      expect(result).toContain('italic text');
    });
  });
});

describe('CSV conversions', () => {
  describe('CSV → Text', () => {
    it('converts simple CSV to readable text', () => {
      const input = 'Name,Age,City\nAlice,30,NYC\nBob,25,LA';
      const result = convertCsvToText(input);
      expect(result).toContain('Name');
      expect(result).toContain('Alice');
      expect(result).toContain('NYC');
    });

    it('handles empty input', () => {
      expect(convertCsvToText('')).toBe('');
    });
  });

  describe('CSV → Markdown', () => {
    it('converts CSV to markdown table', () => {
      const input = 'Name,Age\nAlice,30\nBob,25';
      const result = convertCsvToMarkdown(input);
      expect(result).toContain('| Name |');
      expect(result).toContain('| Alice |');
      expect(result).toContain('| Bob |');
      expect(result).toContain('---');
    });
  });

  describe('CSV → CSV (re-format)', () => {
    it('normalizes CSV formatting', () => {
      const input = 'Name,Age\nAlice,30\nBob,25';
      const result = convertCsvToCsv(input);
      expect(result).toContain('Name,Age');
      expect(result).toContain('Alice,30');
    });
  });

  describe('CSV → LaTeX', () => {
    it('converts CSV to LaTeX table', () => {
      const input = 'Name,Age\nAlice,30\nBob,25';
      const result = convertCsvToLatex(input);
      expect(result).toContain('\\begin{tabular}');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });
  });
});

describe('TXT conversions', () => {
  describe('TXT → Markdown', () => {
    it('wraps text in markdown paragraphs', () => {
      const result = convertTxtToMarkdown('Hello world');
      expect(typeof result).toBe('string');
      expect(result).toContain('Hello world');
    });

    it('handles empty input', () => {
      expect(convertTxtToMarkdown('').trim()).toBe('');
    });
  });

  describe('TXT → CSV', () => {
    it('handles text input', () => {
      const result = convertTxtToCsv('Hello world');
      expect(typeof result).toBe('string');
    });
  });

  describe('TXT → LaTeX', () => {
    it('wraps text in LaTeX document', () => {
      const result = convertTxtToLatex('Hello world');
      expect(typeof result).toBe('string');
      expect(result).toContain('Hello world');
    });
  });
});

describe('Mermaid conversions', () => {
  describe('Mermaid → HTML', () => {
    it('wraps mermaid in HTML container', () => {
      const result = convertMermaidToHtml('graph TD; A-->B');
      expect(result).toContain('mermaid');
      expect(result).toContain('graph TD');
    });
  });

  describe('Mermaid → CSV', () => {
    it('handles mermaid input', () => {
      const result = convertMermaidToCsv('graph TD; A-->B');
      expect(typeof result).toBe('string');
    });
  });
});

describe('LaTeX conversions', () => {
  describe('LaTeX → Markdown', () => {
    it('converts sections to markdown headings', () => {
      const input = '\\begin{document}\n\\section{My Title}\nSome content here.\n\\end{document}';
      const result = convertLatexToMarkdown(input);
      expect(result).toContain('My Title');
      expect(result).toContain('Some content here.');
    });

    it('converts bold', () => {
      const input = '\\begin{document}\n\\textbf{bold text}\n\\end{document}';
      const result = convertLatexToMarkdown(input);
      expect(result).toContain('bold text');
    });

    it('converts italic', () => {
      const input = '\\begin{document}\n\\textit{italic text}\n\\end{document}';
      const result = convertLatexToMarkdown(input);
      expect(result).toContain('italic text');
    });
  });

  describe('LaTeX → Text', () => {
    it('strips LaTeX commands', () => {
      const input = '\\begin{document}\n\\section{Title}\n\\textbf{bold} and \\textit{italic}\n\\end{document}';
      const result = convertLatexToText(input);
      expect(result.toUpperCase()).toContain('TITLE');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
    });
  });

  describe('LaTeX → HTML', () => {
    it('converts LaTeX to HTML', () => {
      const input = '\\begin{document}\n\\section{Title}\n\\textbf{bold}\n\\end{document}';
      const result = convertLatexToHtml(input);
      expect(result).toContain('Title');
      expect(result).toContain('bold');
    });
  });
});

describe('Edge cases', () => {
  it('handles very long input', () => {
    const longInput = '# Heading\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(1000);
    const result = convertMarkdownToText(longInput);
    expect(result).toContain('HEADING');
    expect(result).toContain('Lorem ipsum');
  });

  it('handles special characters', () => {
    const input = 'Special chars: <>&"\'\\';
    const result = convertMarkdownToHtml(input);
    expect(result).toBeDefined();
  });

  it('handles unicode', () => {
    const input = '# 日本語テスト\n\nこれはテストです。';
    const result = convertMarkdownToText(input);
    expect(result).toContain('日本語テスト');
    expect(result).toContain('テスト');
  });
});
