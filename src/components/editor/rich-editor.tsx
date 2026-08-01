"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  height?: number;
}

export default function RichEditor({ value, onChange, height = 500 }: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: "rounded-xl bg-slate-100 p-4 text-sm" } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-2xl" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none px-5 pb-6 prose-headings:font-display prose-headings:text-ink prose-p:text-ink-muted prose-a:text-brand-700 prose-img:rounded-2xl focus:outline-none",
        style: `min-height:${height}px`,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && current !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        style={{ minHeight: height }}
        className="rounded-xl bg-surface-subtle/50"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-surface-muted bg-surface-subtle/60 px-2 py-1.5">
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()}>
          <Redo2 size={16} />
        </ToolbarButton>

        <Separator />

        <select
          title="Block type"
          value={editor.isActive("heading") ? `h${editor.getAttributes("heading").level}` : "p"}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run();
          }}
          className="mr-1 h-8 rounded-lg border border-surface-muted bg-white px-2 text-xs font-semibold text-ink-soft outline-none focus:border-brand-300"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>

        <ToolbarButton title="Text color" active={!!editor.getAttributes("textStyle").color} onClick={() => {}}>
          <span className="relative">
            <Palette size={16} />
            <input
              type="color"
              value={(editor.getAttributes("textStyle").color as string) || "#0f172a"}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </span>
        </ToolbarButton>

        <Separator />

        <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={16} />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify size={16} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 size={16} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton title="Link" active={editor.isActive("link")} onClick={() => setLink(editor)}>
          <Link2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Insert image" onClick={() => addImage(editor)}>
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Insert table" active={editor.isActive("table")} onClick={() => addTable(editor)}>
          <TableIcon size={16} />
        </ToolbarButton>

        <Separator />

        <ToolbarButton title="Remove formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <RemoveFormatting size={16} />
        </ToolbarButton>
        <ToolbarButton title="Code (inline)" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code size={16} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap table { border-collapse: collapse; margin: 1rem 0; width: 100%; }
        .tiptap th, .tiptap td {
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          min-width: 4rem;
        }
        .tiptap th { background: #f8fafc; font-weight: 600; }
        .tiptap .selectedCell::after { background: rgba(2, 132, 199, 0.1); content: ""; inset: 0; pointer-events: none; position: absolute; z-index: 2; }
        .tiptap table .column-resize-handle {
          background-color: #2563eb;
          bottom: -2px;
          pointer-events: none;
          position: absolute;
          right: -2px;
          top: 0;
          width: 4px;
        }
      `}</style>
    </div>
  );
}

function setLink(editor: Editor) {
  const prev = (editor.getAttributes("link").href as string | undefined) || "https://";
  const url = window.prompt("Enter URL (leave empty to remove)", prev);
  if (url === null) return;
  if (url.trim() === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}

function addImage(editor: Editor) {
  const url = window.prompt("Enter image URL");
  if (url && url.trim()) {
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }
}

function addTable(editor: Editor) {
  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}

function Separator() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-surface-muted" />;
}

function ToolbarButton({
  title,
  onClick,
  active,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
        active ? "bg-brand-50 text-brand-700" : "text-ink-soft"
      } hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
