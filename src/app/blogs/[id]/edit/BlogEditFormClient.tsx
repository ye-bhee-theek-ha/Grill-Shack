// app/blogs/[id]/edit/BlogEditFormClient.tsx
"use client";

import { useState, useRef, ChangeEvent, FormEvent, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase/ClientApp";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  uploadString,
} from "firebase/storage";
import { JSONContent } from "@tiptap/react";

import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
import PulsingDotsSpinner from "@/components/Spinner";
import { BlogMetadataForClient } from "../BlogDisplayClient";

import { useRouter } from "next/navigation";
import useUser from "@/hooks/useUser";

// Utility to convert file to Base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Invalid file type. Only images are allowed."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Interface for the content document stored in Firestore (content subcollection)
interface BlogContentDocument {
  contentStoragePath?: string;
  content?: JSONContent | string;
}

interface BlogEditClientProps {
  initialMetadata: BlogMetadataForClient & {
    videoStoragePath?: string;
    contentStoragePath?: string;
  };
}

const BlogEditFormClient: React.FC<BlogEditClientProps> = ({
  initialMetadata,
}) => {
  const router = useRouter();
  const storage = getStorage();

  const [title, setTitle] = useState<string>("");
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null);
  const [initialEditorContentJSONString, setInitialEditorContentJSONString] =
    useState<string | null>(null); // To track if content changed

  // Cover Image States
  const [currentCoverImageUrl, setCurrentCoverImageUrl] = useState<
    string | undefined
  >(undefined);
  const [newCoverImageBase64, setNewCoverImageBase64] = useState<string | null>(
    null
  );
  const [newCoverImageFile, setNewCoverImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Video States
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | undefined>(
    undefined
  );
  const [currentVideoStoragePath, setCurrentVideoStoragePath] = useState<
    string | undefined
  >(undefined);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [newVideoDownloadURL, setNewVideoDownloadURL] = useState<string | null>(
    null
  );
  const [newVideoStoragePath, setNewVideoStoragePath] = useState<string | null>(
    null
  );
  const [videoError, setVideoError] = useState<string | null>(null);

  const [contentLoading, setContentLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [postArchived, setPostArchived] = useState(false);

  const [currentContentStoragePath, setCurrentContentStoragePath] = useState<
    string | undefined
  >(undefined);

  const formRef = useRef<HTMLFormElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { profile, isLoading } = useUser();

  useEffect(() => {
    if (initialMetadata) {
      setTitle(initialMetadata.title);
      setCurrentCoverImageUrl(initialMetadata.coverImage);
      setImagePreview(initialMetadata.coverImage || null);
      setPostArchived(initialMetadata.archived || false);
      setCurrentVideoUrl(initialMetadata.videoUrl);
      setVideoPreviewUrl(initialMetadata.videoUrl || null);
      setCurrentVideoStoragePath(initialMetadata.videoStoragePath);
    } else {
      setError("Blog metadata not provided. Cannot initialize editor.");
      setContentLoading(false);
    }
  }, [initialMetadata]);

  useEffect(() => {
    if (
      !initialMetadata ||
      !initialMetadata.id ||
      !initialMetadata.contentStoragePath ||
      !initialMetadata.restaurantId
    ) {
      if (initialMetadata) {
        setError(
          "Required information to fetch blog content is missing from metadata."
        );
      }
      setContentLoading(false);
      return;
    }

    const fetchContentFromStorage = async () => {
      setContentLoading(true);
      setError(null);
      setEditorContent(null);

      try {
        const pathReference = storageRef(
          storage,
          initialMetadata.contentStoragePath
        );
        const downloadURL = await getDownloadURL(pathReference);

        const response = await fetch(downloadURL);
        if (!response.ok) {
          throw new Error(
            `Failed to download content file: ${response.status} ${response.statusText}`
          );
        }
        const contentString = await response.text();

        if (contentString) {
          let parsedJsonContent: JSONContent | null = null;
          try {
            parsedJsonContent = JSON.parse(contentString);
          } catch (parseError) {
            console.error(
              "Error parsing blog content JSON from storage:",
              parseError
            );
            setError("Blog content is malformed and could not be displayed.");
            setEditorContent({ type: "doc", content: [] });
            return;
          }

          if (
            parsedJsonContent &&
            typeof parsedJsonContent === "object" &&
            parsedJsonContent.type === "doc" &&
            Array.isArray(parsedJsonContent.content)
          ) {
            setEditorContent(parsedJsonContent);
          } else {
            console.warn(
              "CLIENT: Parsed content from storage is not a valid Tiptap 'doc':",
              parsedJsonContent
            );
            setError("Blog content format from storage is invalid.");
            setEditorContent({ type: "doc", content: [] });
          }
        } else {
          setError("Blog content file from storage is empty.");
          setEditorContent({ type: "doc", content: [] }); // Fallback
        }
      } catch (err) {
        console.error("CLIENT: Error fetching blog content from storage:", err);
        setError(
          err instanceof Error
            ? `Failed to load content: ${err.message}`
            : "An unknown error occurred while fetching content."
        );
        setEditorContent({ type: "doc", content: [] }); // Fallback
      } finally {
        setContentLoading(false);
      }
    };

    fetchContentFromStorage();
  }, [initialMetadata, storage]);

  const handleContentChange = (content: JSONContent) => {
    setEditorContent(content);
  };

  const handleCoverImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError(null);
    setSuccessMessage(null);
    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type. Please select an image.");
        setNewCoverImageFile(null);
        setImagePreview(currentCoverImageUrl || null);
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
        return;
      }
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_SIZE) {
        setError(`Cover image size exceeds ${MAX_SIZE / (1024 * 1024)}MB.`);
        setNewCoverImageFile(null);
        setImagePreview(currentCoverImageUrl || null);
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
        return;
      }
      setNewCoverImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      try {
        const base64 = await convertFileToBase64(file);
        setNewCoverImageBase64(base64);
      } catch (err) {
        console.error("Error converting new cover image to Base64:", err);
        setError(
          err instanceof Error ? err.message : "Error processing image."
        );
        setNewCoverImageFile(null);
        setNewCoverImageBase64(null);
        setImagePreview(currentCoverImageUrl || null);
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
      }
    } else {
      setNewCoverImageFile(null);
      setNewCoverImageBase64(null);
      setImagePreview(currentCoverImageUrl || null);
    }
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideoError(null);
    setError(null);
    setSuccessMessage(null);
    setNewVideoDownloadURL(null);
    setNewVideoStoragePath(null);
    setVideoUploadProgress(0);

    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (!file.type.startsWith("video/")) {
        setVideoError(
          "Invalid file type. Please select a video (e.g., MP4, WebM)."
        );
        setNewVideoFile(null);
        setVideoPreviewUrl(currentVideoUrl || null);
        if (videoInputRef.current) videoInputRef.current.value = "";
        return;
      }
      const MAX_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setVideoError(`Video file size exceeds ${MAX_SIZE / (1024 * 1024)}MB.`);
        setNewVideoFile(null);
        setVideoPreviewUrl(currentVideoUrl || null);
        if (videoInputRef.current) videoInputRef.current.value = "";
        return;
      }
      setNewVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(objectUrl);
      uploadVideo(file);
    } else {
      setNewVideoFile(null);
      setVideoPreviewUrl(currentVideoUrl || null);
    }
  };

  const uploadVideo = async (file: File) => {
    if (
      !initialMetadata ||
      !initialMetadata.restaurantId ||
      !initialMetadata.id
    ) {
      setVideoError(
        "Cannot upload video: missing essential blog/restaurant ID."
      );
      return;
    }
    setVideoUploading(true);
    setVideoUploadProgress(0);

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const videoPath = `restaurant_assets/${initialMetadata.restaurantId}/blog_videos/${initialMetadata.id}/${fileName}`;
    const fileRef = storageRef(storage, videoPath);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setVideoUploadProgress(progress);
      },
      (error) => {
        console.error("Video upload error:", error);
        setVideoError(`Upload failed: ${error.message}`);
        setVideoUploading(false);
        setNewVideoFile(null);
        setVideoPreviewUrl(currentVideoUrl || null);
        if (videoInputRef.current) videoInputRef.current.value = "";
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setNewVideoDownloadURL(downloadURL);
          setNewVideoStoragePath(uploadTask.snapshot.ref.fullPath);
          setVideoUploading(false);
          setSuccessMessage(
            "Video uploaded successfully. Save post to apply changes."
          );
        } catch (error) {
          console.error("Error getting download URL:", error);
          setVideoError("Upload succeeded but failed to get URL.");
          setVideoUploading(false);
        }
      }
    );
  };

  const deleteOldVideo = async (oldVideoStoragePath: string | undefined) => {
    if (!oldVideoStoragePath) return;
    try {
      const videoToDeleteRef = storageRef(storage, oldVideoStoragePath);
      await deleteObject(videoToDeleteRef);
      console.log("Successfully deleted old video:", oldVideoStoragePath);
    } catch (error) {
      console.error("Error deleting old video:", oldVideoStoragePath, error);
      setError((prevError) =>
        prevError
          ? `${prevError}. Failed to delete previous video from storage.`
          : "Failed to delete previous video from storage."
      );
    }
  };

  const handleUpdate = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Use initialMetadata.id for constructing paths, contentStoragePath for knowing where current content is.
    if (
      !initialMetadata ||
      !initialMetadata.restaurantId ||
      !initialMetadata.id
    ) {
      setError(
        "Essential blog information (ID, RestaurantID) is missing. Cannot update."
      );
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    const isEmptyTiptapContent =
      !editorContent ||
      !editorContent.content ||
      (editorContent.content.length === 1 &&
        editorContent.content[0].type === "paragraph" &&
        (!editorContent.content[0].content ||
          editorContent.content[0].content.length === 0));
    if (isEmptyTiptapContent) {
      setError("Blog content cannot be empty.");
      return;
    }
    if (videoUploading) {
      setError("Please wait for the video upload to complete before saving.");
      return;
    }

    setIsUpdating(true);
    let oldVideoPathToDeleteAfterSave: string | undefined = undefined;

    // Determine the storage path for content. If it doesn't exist on initialMetadata, create one.
    let contentJsonStoragePath =
      initialMetadata.contentStoragePath ||
      `restaurant_assets/${initialMetadata.restaurantId}/blog_content/${initialMetadata.id}/content.json`;

    console.log("contentJsonStoragePath", contentJsonStoragePath);

    try {
      const blogMetaDocRef = doc(
        db,
        `Restaurants/${initialMetadata.restaurantId}/blogs`,
        initialMetadata.id
      );
      const metadataToUpdate: any = {
        title: title,
        archived: postArchived,
        updatedAt: serverTimestamp(),
        // contentStoragePath will be updated if content changes or if it was initially missing
      };

      if (newCoverImageBase64) {
        metadataToUpdate.coverImage = newCoverImageBase64;
      }

      if (newVideoDownloadURL && newVideoStoragePath) {
        metadataToUpdate.videoUrl = newVideoDownloadURL;
        metadataToUpdate.videoStoragePath = newVideoStoragePath;
        if (
          currentVideoStoragePath &&
          currentVideoStoragePath !== newVideoStoragePath
        ) {
          oldVideoPathToDeleteAfterSave = currentVideoStoragePath;
        }
      } else if (newVideoFile && !newVideoDownloadURL) {
        setError(
          "Video selected but not fully processed. Please try re-selecting or wait."
        );
        setIsUpdating(false);
        return;
      }

      // Handle blog content update (upload to storage if changed or if path was initially missing)
      const currentEditorContentString = editorContent
        ? JSON.stringify(editorContent)
        : JSON.stringify({ type: "doc", content: [] });
      let contentHasChanged =
        currentEditorContentString !== initialEditorContentJSONString;

      if (contentHasChanged || !initialMetadata.contentStoragePath) {
        const contentFileRef = storageRef(storage, contentJsonStoragePath);
        await uploadString(contentFileRef, currentEditorContentString, "raw", {
          contentType: "application/json",
        });
        console.log(
          "Blog content updated/created in Firebase Storage at:",
          contentJsonStoragePath
        );
        metadataToUpdate.contentStoragePath = contentJsonStoragePath;
        setInitialEditorContentJSONString(currentEditorContentString);
      }

      // Update the main blog document with all changes
      await updateDoc(blogMetaDocRef, metadataToUpdate);

      setSuccessMessage("Blog post updated successfully!");

      if (oldVideoPathToDeleteAfterSave) {
        await deleteOldVideo(oldVideoPathToDeleteAfterSave);
      }

      if (newCoverImageBase64) {
        setCurrentCoverImageUrl(newCoverImageBase64);
      }
      if (newVideoDownloadURL && newVideoStoragePath) {
        setCurrentVideoUrl(newVideoDownloadURL);
        setCurrentVideoStoragePath(newVideoStoragePath);
      }
      // setCurrentContentStoragePath is implicitly updated if metadataToUpdate.contentStoragePath was set
      if (metadataToUpdate.contentStoragePath) {
        // No direct state for currentContentStoragePath, it's derived from initialMetadata or updated in metadataToUpdate
      }

      setNewCoverImageBase64(null);
      setNewCoverImageFile(null);
      setNewVideoFile(null);
      setNewVideoDownloadURL(null);
      setNewVideoStoragePath(null);
      setVideoUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
    } catch (err) {
      console.error("Error updating document(s): ", err);
      setError(
        err instanceof Error
          ? `Failed to update post: ${err.message}`
          : "An unknown error occurred during update."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (error || successMessage || videoError) {
      timer = setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
        setVideoError(null);
      }, 7000);
    }
    return () => clearTimeout(timer);
  }, [error, successMessage, videoError]);

  if (isLoading && !initialMetadata) {
    // Show global loading if auth is loading and no data yet
    return (
      <div className="flex justify-center items-center h-screen">
        <PulsingDotsSpinner /> <p className="ml-2">Loading user...</p>
      </div>
    );
  }
  if (profile?.role !== "admin" && !isLoading) {
    router.push("/login");
    return (
      <div className="flex justify-center items-center h-screen">
        <PulsingDotsSpinner /> <p className="ml-2">Redirecting to login...</p>
      </div>
    );
  }

  if (!initialMetadata && !error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-primary">
        <PulsingDotsSpinner color="currentColor" />
        <p className="mt-4 text-xl">Loading editor setup...</p>
      </div>
    );
  }

  if (error && !initialMetadata) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-600 p-4">
        <p className="text-2xl font-semibold">Error Loading Editor</p>
        <p className="mt-2 text-center">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-creto h-screen overflow-auto flex flex-col bg-gray-50 no-scrollbar">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800">
        Edit Blog Post
      </h1>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded fixed right-10 top-20 z-50 mb-4 shadow-lg opacity-80"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="px-4 text-red-700">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded fixed right-10 top-20 z-50 mb-4 shadow-lg opacity-80"
          role="alert"
        >
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="px-4 text-green-700"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      {videoError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed right-10 top-32 z-50 mb-4 shadow-lg"
          role="alert"
        >
          <strong className="font-bold">Video Error: </strong>
          <span className="block sm:inline">{videoError}</span>
          <button
            onClick={() => setVideoError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleUpdate}
        className="mx-auto w-full max-w-4xl flex flex-col flex-grow"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {/* Column 1: Title and Archive */}
          <div>
            <div className="mb-6">
              <label
                htmlFor="blogTitle"
                className="block text-lg font-medium text-gray-700 mb-2"
              >
                Blog Title
              </label>
              <input
                type="text"
                id="blogTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-base"
                required
              />
            </div>
            <div className="mb-6 flex items-center gap-x-3">
              <input
                type="checkbox"
                id="archive"
                checked={postArchived}
                onChange={(e) => setPostArchived(e.target.checked)}
                className="w-5 h-5 accent-primary text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
              />
              <label
                htmlFor="archive"
                className="text-lg font-medium text-gray-700"
              >
                Archive Post
              </label>
            </div>
          </div>

          {/* Column 2: Cover Image */}
          <div className="mb-6">
            <label
              htmlFor="coverImage"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Cover Image
            </label>
            <input
              type="file"
              id="coverImage"
              accept="image/*"
              onChange={handleCoverImageChange}
              ref={coverImageInputRef}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary-dark hover:file:text-white"
            />
            {imagePreview && (
              <div className="mt-3">
                <Image
                  src={imagePreview}
                  alt="Cover preview"
                  width={160}
                  height={90}
                  className="rounded-md border border-gray-300 object-cover max-h-24 w-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Video Upload Section - Full Width */}
        <div className="mb-6">
          <label
            htmlFor="blogVideo"
            className="block text-lg font-medium text-gray-700 mb-2"
          >
            Blog Video (Optional)
          </label>
          <input
            type="file"
            id="blogVideo"
            accept="video/*"
            onChange={handleVideoChange}
            ref={videoInputRef}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {videoUploading && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${videoUploadProgress}%` }}
              ></div>
              <p className="text-xs text-center text-gray-600">
                {Math.round(videoUploadProgress)}% uploaded
              </p>
            </div>
          )}
          {videoPreviewUrl && !videoUploading && (
            <div className="mt-3">
              <video
                src={videoPreviewUrl}
                controls
                width="320"
                className="rounded-md border border-gray-300 max-h-48 w-auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {newVideoDownloadURL && !videoUploading && (
            <p className="mt-1 text-xs text-green-600">
              Video ready. Save post to apply.
            </p>
          )}
        </div>

        <div className="mb-6 flex-grow flex flex-col h-full p-4 md:p-6 bg-white shadow-lg rounded-lg border border-gray-200">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Blog Content
          </label>
          {contentLoading ? (
            <div className="flex justify-center items-center min-h-[300px] md:min-h-[400px] border border-gray-300 rounded-md">
              <PulsingDotsSpinner
                color="currentColor"
                className="text-primary"
              />
              <p className="ml-2">Loading content...</p>
            </div>
          ) : (
            // Removed specific error check here, rely on general error display or editorContent being null
            <div className="min-h-[300px] md:min-h-[400px] no-scrollbar tiptap-editor-container">
              <SimpleEditor
                key={initialMetadata?.id}
                initialContent={editorContent || { type: "doc", content: [] }} // Provide a default empty doc
                onContentChange={handleContentChange}
              />
            </div>
          )}
        </div>
      </form>
      <div className="flex justify-between items-center mt-auto pt-6 pb-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() =>
            router.push(
              initialMetadata?.id ? `/blogs/${initialMetadata.id}` : "/blogs"
            )
          }
          className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isUpdating || contentLoading || videoUploading}
          className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-lg rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating
            ? "Updating..."
            : videoUploading
              ? "Uploading Video..."
              : "Update Post"}
        </button>
      </div>
    </div>
  );
};

export default BlogEditFormClient;
