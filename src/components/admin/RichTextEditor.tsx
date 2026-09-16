"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { LinkIcon } from "@/components/ui/Icons";

interface Props {
  name: string;
  initialContent?: string;
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`min-h-[36px] min-w-[36px] border border-line px-2 text-headline-s dark:border-line-dark ${
        active ? "bg-brand-red text-white" : "hover:border-brand-red"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({ name, initialContent = "" }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow ugc" },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral min-h-[280px] max-w-none border border-line border-t-0 px-3 py-3 text-body focus:outline-none dark:border-line-dark dark:prose-invert",
      },
    },
  });

  // Gizli input, form submit edildiginde editorun guncel HTML icerigini tasir.
  useEffect(() => {
    if (!editor) return;
    const hiddenInput = document.getElementById(`${name}-hidden`) as HTMLInputElement | null;
    if (hiddenInput) hiddenInput.value = editor.getHTML();

    const handleUpdate = () => {
      if (hiddenInput) hiddenInput.value = editor.getHTML();
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, name]);

  if (!editor) {
    return <div className="min-h-[320px] border border-line dark:border-line-dark" />;
  }

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("Bağlantı URL'si", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 border border-line p-1 dark:border-line-dark">
        <ToolbarButton label="Kalın" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>K</strong>
        </ToolbarButton>
        <ToolbarButton label="İtalik" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>İ</em>
        </ToolbarButton>
        <ToolbarButton label="Altı çizili" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <span className="underline">A</span>
        </ToolbarButton>
        <ToolbarButton label="Üstü çizili" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">A</span>
        </ToolbarButton>
        <ToolbarButton label="Alt başlık" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolbarButton>
        <ToolbarButton label="Alt başlık 2" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolbarButton>
        <ToolbarButton label="Madde işaretli liste" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          •
        </ToolbarButton>
        <ToolbarButton label="Numaralı liste" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1.
        </ToolbarButton>
        <ToolbarButton label="Alıntı" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          &ldquo;&rdquo;
        </ToolbarButton>
        <ToolbarButton label="Bağlantı ekle" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon width={16} height={16} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" id={`${name}-hidden`} name={name} />
    </div>
  );
}
