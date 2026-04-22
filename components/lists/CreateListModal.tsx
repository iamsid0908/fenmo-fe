"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { listService } from "@/lib/api/list.service";
import { ApiError } from "@/lib/api/client";
import type { CreateUserListData } from "@/types/list";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (list: CreateUserListData) => void;
}

export function CreateListModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  // auto-focus name input & reset state on open
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setNameError(null);
      setServerError(null);
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [open]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setNameError("List name is required.");
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      const res = await listService.createUserList({
        name: name.trim(),
        description: description.trim(),
      });
      onCreated(res.data);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="create-list-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="create-list-title"
            className="text-base font-semibold text-gray-900"
          >
            Create New List
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 px-6 py-5">
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {serverError}
            </div>
          )}

          <Input
            ref={nameRef}
            label="List Name"
            name="name"
            type="text"
            placeholder="e.g. Groceries, Trip to Goa"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
              setServerError(null);
            }}
            error={nameError ?? undefined}
            disabled={loading}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What is this list for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-150 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} size="md">
              Create List
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
