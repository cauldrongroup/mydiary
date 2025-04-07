"use client";

import { useEffect, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView, ViewPlugin, DecorationSet, Decoration, ViewUpdate, WidgetType } from '@codemirror/view';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { RangeSetBuilder } from '@codemirror/state';

// Custom theme for Markdown syntax highlighting
const markdownHighlighting = HighlightStyle.define([
  {
    tag: t.heading1,
    fontSize: "2em",
    fontWeight: "bold",
  },
  {
    tag: t.heading2,
    fontSize: "1.5em",
    fontWeight: "bold",
  },
  {
    tag: t.heading3,
    fontSize: "1.17em",
    fontWeight: "bold",
  },
  {
    tag: t.heading,
    fontWeight: "bold",
  },
  {
    tag: t.strong,
    fontWeight: "bold"
  },
  {
    tag: t.emphasis,
    fontStyle: "italic"
  },
  {
    tag: t.link,
    textDecoration: "underline"
  },
  {
    tag: t.url,
    textDecoration: "underline"
  },
  {
    tag: t.quote,
    fontStyle: "italic"
  }
]);

// Hide markdown syntax on non-active lines
const hideMarkdownPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet;

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || update.selectionSet) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>();
    const activeLine = view.state.selection.main.head;
    
    // Get the line number of the cursor
    const activeLineNumber = view.state.doc.lineAt(activeLine).number;

    for (const { from, to } of view.visibleRanges) {
      for (let pos = from; pos <= to;) {
        const line = view.state.doc.lineAt(pos);
        const text = line.text;
        let match;

        const isActiveLine = line.number === activeLineNumber;

        // Add decorations for markdown syntax
        const addDecoration = (start: number, end: number) => {
          builder.add(
            start, 
            end, 
            isActiveLine 
              ? Decoration.mark({ class: "cm-active-markdown" })
              : Decoration.replace({
                  widget: new class extends WidgetType {
                    eq(other: WidgetType) { return other.toDOM === this.toDOM }
                    toDOM() {
                      const span = document.createElement('span');
                      span.className = 'cm-inactive-markdown';
                      span.textContent = view.state.sliceDoc(start, end);
                      return span;
                    }
                  },
                })
          );
        };

        // Headers
        if (text.match(/^#+\s/)) {
          addDecoration(line.from, line.from + text.indexOf(' ') + 1);
        }

        // Bold and Italic
        const styleRegex = /(\*\*|\*|__|\b_)(?:(?!\1).)+?\1/g;
        while ((match = styleRegex.exec(text)) !== null) {
          const [full] = match;
          const start = line.from + match.index;
          const end = start + (full.startsWith('**') || full.startsWith('__') ? 2 : 1);
          const endPos = start + full.length - (full.startsWith('**') || full.startsWith('__') ? 2 : 1);
          addDecoration(start, end);
          addDecoration(endPos, endPos + (full.startsWith('**') || full.startsWith('__') ? 2 : 1));
        }

        // Links
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        while ((match = linkRegex.exec(text)) !== null) {
          const start = line.from + match.index;
          addDecoration(start, start + 1);
          addDecoration(start + match[1].length + 1, start + match[0].length);
        }

        // Lists
        if (text.match(/^[\s]*[-*+]\s/)) {
          addDecoration(line.from, line.from + text.indexOf(' ') + 1);
        }

        pos = line.to + 1;
      }
    }
    return builder.finish();
  }
}, {
  decorations: v => v.decorations,
});

// Custom theme for the editor
const editorTheme = EditorView.theme({
  '&': {
    fontSize: '16px',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    fontFamily: 'inherit',
    padding: '1rem 0',
  },
  '.cm-line': {
    padding: '0 0.5rem',
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--primary)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.6',
  },
  '.cm-active-markdown': {
    color: 'var(--muted-foreground)',
  },
  '.cm-inactive-markdown': {
    position: 'absolute',
    display: 'inline-block',
    width: '0',
    overflow: 'hidden',
    opacity: '0',
    color: 'transparent',
  }
});

// Create markdown extension with proper configuration
const markdownExtension = markdown({
  codeLanguages: languages
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      extensions={[
        markdownExtension,
        syntaxHighlighting(markdownHighlighting),
        hideMarkdownPlugin,
        editorTheme,
        EditorView.lineWrapping,
      ]}
      className="w-full min-h-[400px] border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
    />
  );
} 