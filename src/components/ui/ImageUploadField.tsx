"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field } from "./Field";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

type Props = {
  /** FormData key the file is submitted under */
  name: string;
  label: string;
  hint?: string;
  /** Public URL of the image already saved, if any */
  currentUrl?: string;
  alt?: string;
};

/**
 * File picker with a live preview, submitted as part of the surrounding
 * <form> (which needs encType="multipart/form-data"). Checking size and type
 * here is a courtesy — the server action and the bucket both re-check.
 */
export function ImageUploadField({ name, label, hint, currentUrl, alt = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);

  // Object URLs leak until revoked; tie each one to the life of the preview.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setError(null);

    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError("Please choose a PNG, JPEG, or WebP image.");
      clearInput();
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be smaller than 2MB.");
      clearInput();
      return;
    }
    setRemove(false);
    setPreview(URL.createObjectURL(file));
  };

  const shown = preview ?? (remove ? null : currentUrl);

  return (
    <Field label={label} htmlFor={name} hint={hint} error={error}>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line",
            shown ? "bg-surface" : "border-dashed bg-canvas text-muted",
          )}
        >
          {shown ? (
            // Blob previews and the saved logo are both plain <img>: next/image
            // can't optimise an object URL, and this is a fixed 80px thumbnail.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt={alt} className="h-full w-full object-contain" />
          ) : (
            <ImageUp size={22} aria-hidden />
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="file"
            accept={ACCEPT.join(",")}
            onChange={onChange}
            className={cn(
              "block w-full text-sm text-muted",
              "file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-line",
              "file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink",
              "file:transition-colors hover:file:border-accent hover:file:text-accent-ink",
            )}
          />
          {currentUrl && !preview && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-danger">
              <input
                type="checkbox"
                name="removeLogo"
                checked={remove}
                onChange={(e) => setRemove(e.target.checked)}
                className="sr-only"
              />
              <Trash2 size={15} aria-hidden />
              {remove ? "Will be removed on save" : "Remove current image"}
            </label>
          )}
        </div>
      </div>
    </Field>
  );
}
