"use client";

/**
 * Create Event Page
 * Client component for creating new events with progressive enhancement
 */

import { useActionState, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createEvent } from "@/lib/actions/events";
import type { ActionResult } from "@/lib/types/actions";
import type { EventDTO } from "@/lib/types/dtos";

/**
 * Initial state for useActionState
 */
const initialState: ActionResult<EventDTO> | null = null;

/**
 * CreateEventPage Component
 */
export default function CreateEventPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    createEvent,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Calculate minimum date on client side only
  const [minDate, setMinDate] = useState<string>("");

  // Form state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [agenda, setAgenda] = useState<string[]>([""]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  /**
   * Set minimum date on client side only
   */
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    setMinDate(`${year}-${month}-${day}`);
  }, []);

  /**
   * Handle successful submission
   */
  useEffect(() => {
    if (state?.ok) {
      // Clear form state
      setTags([]);
      setTagInput("");
      setAgenda([""]);
      setImagePreview(null);
      setImageFile(null);
      formRef.current?.reset();

      // Navigate to the created event
      router.push(`/events/${state.data.slug}`);
    }
  }, [state, router]);

  /**
   * Get field error from Zod issues
   */
  const getFieldError = (fieldName: string): string | undefined => {
    if (!state?.ok && state?.issues) {
      const issue = state.issues.find((issue) => issue.path[0] === fieldName);
      return issue?.message;
    }
    return undefined;
  };

  /**
   * Handle tag input
   */
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = tagInput.trim();

    if ((e.key === "Enter" || e.key === ",") && value) {
      e.preventDefault();
      if (!tags.includes(value) && tags.length < 10) {
        setTags([...tags, value]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  /**
   * Remove tag
   */
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  /**
   * Handle agenda item change
   */
  const handleAgendaChange = (index: number, value: string) => {
    const newAgenda = [...agenda];
    newAgenda[index] = value;
    setAgenda(newAgenda);
  };

  /**
   * Add agenda item
   */
  const addAgendaItem = () => {
    if (agenda.length < 20) {
      setAgenda([...agenda, ""]);
    }
  };

  /**
   * Remove agenda item
   */
  const removeAgendaItem = (index: number) => {
    if (agenda.length > 1) {
      setAgenda(agenda.filter((_, i) => i !== index));
    }
  };

  /**
   * Handle agenda keyboard input
   */
  const handleAgendaKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter" && agenda[index].trim() && agenda.length < 20) {
      e.preventDefault();
      addAgendaItem();
    }
  };

  /**
   * Handle image upload
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        e.target.value = "";
        return;
      }

      // Validate file type
      if (
        !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        )
      ) {
        alert("Image must be JPEG, PNG, or WebP format");
        e.target.value = "";
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Remove image
   */
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (formRef.current) {
      const fileInput = formRef.current.querySelector(
        'input[name="image"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-5 sm:px-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-gradient mb-2 text-4xl font-bold sm:text-5xl">
            Create an Event
          </h1>
          <p className="text-light-200 text-sm">
            Fill in the details to create your event
          </p>
        </div>

        {/* Error Alert */}
        {!state?.ok && state?.message && !state?.issues && (
          <div className="bg-destructive/10 border-destructive/50 mb-6 rounded-lg border p-4">
            <p className="text-destructive text-sm">{state.message}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="card-shadow rounded-xl bg-dark-100 p-6 sm:p-8">
          <form
            ref={formRef}
            action={formAction}
            className="flex flex-col gap-6"
          >
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="title"
                className="text-light-200 text-sm font-medium"
              >
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Enter event title"
                minLength={3}
                maxLength={200}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("title") && (
                <p className="text-destructive text-xs">
                  {getFieldError("title")}
                </p>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="date"
                className="text-light-200 text-sm font-medium"
              >
                Event Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="date"
                  name="date"
                  min={minDate}
                  required
                  disabled={isPending}
                  className="w-full rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
              </div>
              {getFieldError("date") && (
                <p className="text-destructive text-xs">
                  {getFieldError("date")}
                </p>
              )}
            </div>

            {/* Time */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="time"
                className="text-light-200 text-sm font-medium"
              >
                Event Time *
              </label>
              <input
                type="time"
                id="time"
                name="time"
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("time") && (
                <p className="text-destructive text-xs">
                  {getFieldError("time")}
                </p>
              )}
            </div>

            {/* Venue */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="venue"
                className="text-light-200 text-sm font-medium"
              >
                Venue *
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                placeholder="Enter venue or online link"
                minLength={2}
                maxLength={200}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("venue") && (
                <p className="text-destructive text-xs">
                  {getFieldError("venue")}
                </p>
              )}
            </div>

            {/* Location */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="location"
                className="text-light-200 text-sm font-medium"
              >
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="City, State/Country"
                minLength={2}
                maxLength={200}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("location") && (
                <p className="text-destructive text-xs">
                  {getFieldError("location")}
                </p>
              )}
            </div>

            {/* Mode */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mode"
                className="text-light-200 text-sm font-medium"
              >
                Event Type *
              </label>
              <select
                id="mode"
                name="mode"
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="">Select event type</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {getFieldError("mode") && (
                <p className="text-destructive text-xs">
                  {getFieldError("mode")}
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="image"
                className="text-light-200 text-sm font-medium"
              >
                Event Image / Banner *
              </label>
              {!imagePreview ? (
                <label
                  htmlFor="image"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-[6px] border-2 border-dashed border-dark-200 bg-dark-200/50 px-5 py-8 transition hover:border-primary/50"
                >
                  <svg
                    className="mb-2 h-8 w-8 text-light-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-light-100 text-sm">
                    Upload event image or banner
                  </p>
                  <p className="text-light-200 mt-1 text-xs">
                    PNG, JPG, WEBP up to 5MB
                  </p>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    disabled={isPending}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={600}
                    height={300}
                    className="h-48 w-full rounded-[6px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isPending}
                    className="absolute right-2 top-2 rounded-full bg-destructive p-2 text-white transition hover:bg-destructive/90 disabled:opacity-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {getFieldError("image") && (
                <p className="text-destructive text-xs">
                  {getFieldError("image")}
                </p>
              )}
              {!imageFile && (
                <p className="text-light-200 text-xs">
                  Please upload an image before submitting
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="tags-input"
                className="text-light-200 text-sm font-medium"
              >
                Tags * (Press Enter or comma to add)
              </label>
              <div className="rounded-[6px] bg-dark-200 p-2">
                <div className="mb-2 flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span key={index} className="pill flex items-center gap-2">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        disabled={isPending}
                        className="text-light-200 hover:text-light-100 disabled:opacity-50"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  id="tags-input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  placeholder="Add tags such as react, next, js"
                  disabled={isPending}
                  className="w-full bg-transparent px-3 py-1 text-light-100 placeholder:text-light-200/50 focus:outline-none disabled:opacity-50"
                />
              </div>
              <input
                type="hidden"
                name="tags"
                value={JSON.stringify(tags.filter((t) => t.trim()))}
              />
              {getFieldError("tags") && (
                <p className="text-destructive text-xs">
                  {getFieldError("tags")}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="description"
                className="text-light-200 text-sm font-medium"
              >
                Event Description * (Brief summary)
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Briefly describe the event"
                minLength={10}
                maxLength={1000}
                rows={3}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("description") && (
                <p className="text-destructive text-xs">
                  {getFieldError("description")}
                </p>
              )}
            </div>

            {/* Overview */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="overview"
                className="text-light-200 text-sm font-medium"
              >
                Event Overview * (Detailed information)
              </label>
              <textarea
                id="overview"
                name="overview"
                placeholder="Provide detailed information about the event"
                minLength={10}
                maxLength={5000}
                rows={6}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("overview") && (
                <p className="text-destructive text-xs">
                  {getFieldError("overview")}
                </p>
              )}
            </div>

            {/* Audience */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="audience"
                className="text-light-200 text-sm font-medium"
              >
                Target Audience *
              </label>
              <input
                type="text"
                id="audience"
                name="audience"
                placeholder="e.g., Developers, Designers, Students"
                minLength={2}
                maxLength={200}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("audience") && (
                <p className="text-destructive text-xs">
                  {getFieldError("audience")}
                </p>
              )}
            </div>

            {/* Organizer */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="organizer"
                className="text-light-200 text-sm font-medium"
              >
                Organizer *
              </label>
              <input
                type="text"
                id="organizer"
                name="organizer"
                placeholder="Organization or person name"
                minLength={2}
                maxLength={200}
                required
                disabled={isPending}
                className="rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              {getFieldError("organizer") && (
                <p className="text-destructive text-xs">
                  {getFieldError("organizer")}
                </p>
              )}
            </div>

            {/* Agenda */}
            <div className="flex flex-col gap-2">
              <label className="text-light-200 text-sm font-medium">
                Agenda * (Press Enter to add more items)
              </label>
              <div className="flex flex-col gap-3">
                {agenda.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        handleAgendaChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleAgendaKeyDown(e, index)}
                      placeholder={`Agenda item ${index + 1}`}
                      disabled={isPending}
                      className="flex-1 rounded-[6px] bg-dark-200 px-5 py-2.5 text-light-100 placeholder:text-light-200/50 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                    {agenda.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(index)}
                        disabled={isPending}
                        className="rounded-[6px] bg-destructive px-4 py-2.5 text-white transition hover:bg-destructive/90 disabled:opacity-50"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {agenda.length < 20 && (
                  <button
                    type="button"
                    onClick={addAgendaItem}
                    disabled={isPending}
                    className="flex items-center gap-2 self-start rounded-[6px] border border-dark-200 bg-dark-200/50 px-4 py-2 text-sm text-light-100 transition hover:bg-dark-200 disabled:opacity-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add agenda item
                  </button>
                )}
              </div>
              <input
                type="hidden"
                name="agenda"
                value={JSON.stringify(agenda.filter((a) => a.trim()))}
              />
              {getFieldError("agenda") && (
                <p className="text-destructive text-xs">
                  {getFieldError("agenda")}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                isPending ||
                tags.length === 0 ||
                !agenda.some((a) => a.trim()) ||
                !imageFile
              }
              className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-primary py-2.5 text-lg font-semibold text-black transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Event...
                </>
              ) : (
                "Create Event"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
