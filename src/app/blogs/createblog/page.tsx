"use client";

import { useState, ChangeEvent, useRef, useEffect } from "react";
import Image from "next/image"; // Import Image for preview
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
import { JSONContent } from "@tiptap/react";

import { db } from "@/lib/firebase/ClientApp";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  uploadString,
  deleteObject as deleteStorageObject,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import useUser from "@/hooks/useUser";

const CreateBlogPage = () => {
  const router = useRouter();
  const storage = getStorage();

  const [title, setTitle] = useState<string>("");
  const [editorContent, setEditorContent] = useState<JSONContent | null>(null);
  const editorContentRef = useRef<{
    json: JSONContent;
    html: string;
  } | null>(null);

  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImageAltText, setCoverImageAltText] = useState<string>(""); // Added for alt text
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState<boolean>(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [videoDownloadURL, setVideoDownloadURL] = useState<string | null>(null);
  const [videoStoragePath, setVideoStoragePath] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [postArchived, setPostArchived] = useState(false);

  const { profile, isLoading } = useUser();

  const formRef = useRef<HTMLFormElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Effect for clearing messages
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

  useEffect(() => {
    if (profile?.role === "admin" && !isLoading) {
      router.replace("/");
    }
  }, []);

  const handleContentChange = (content: JSONContent) => {
    setEditorContent(content);
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideoError(null);
    setError(null);
    setSuccessMessage(null);
    setVideoDownloadURL(null);
    setVideoStoragePath(null);
    setVideoUploadProgress(0);
    setVideoFile(null);
    setVideoPreviewUrl(null);

    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type
      if (!file.type.startsWith("video/")) {
        setVideoError(
          "Invalid file type. Please select a video (e.g., MP4, WebM)."
        );
        if (videoInputRef.current) videoInputRef.current.value = "";
        return;
      }
      // Validate file size
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_SIZE) {
        setVideoError(`Video file size exceeds ${MAX_SIZE / (1024 * 1024)}MB.`);
        if (videoInputRef.current) videoInputRef.current.value = "";
        return;
      }
      setVideoFile(file);
      const objectUrl = URL.createObjectURL(file);
      setVideoPreviewUrl(objectUrl);
      uploadVideo(file);
    }
  };

  const uploadVideo = async (file: File) => {
    const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;
    if (!restaurantId) {
      setVideoError("Restaurant ID is not configured. Cannot upload video.");
      setVideoUploading(false);
      return;
    }

    setVideoUploading(true);
    setVideoUploadProgress(0);

    // Create a temporary identifier for the video path before blog ID is known
    const tempBlogIdentifier = `new_blog_video_${profile?.uid || "anon"}_${Date.now()}`;
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const videoPath = `restaurant_assets/${restaurantId}/blog_videos/${tempBlogIdentifier}/${fileName}`;

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
        setVideoFile(null);
        setVideoPreviewUrl(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setVideoDownloadURL(downloadURL);
          setVideoStoragePath(uploadTask.snapshot.ref.fullPath); // Save the full storage path
          setVideoUploading(false);
          setSuccessMessage("Video uploaded. Save post to finalize.");
        } catch (uploadError) {
          console.error("Error getting download URL:", uploadError);
          setVideoError("Upload succeeded but failed to get URL.");
          setVideoUploading(false);
        }
      }
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Form validation
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    const currentEditorData = editorContent;

    const isEmptyContent =
      !currentEditorData ||
      !currentEditorData.content ||
      (currentEditorData.content.length === 1 &&
        currentEditorData.content[0].type === "paragraph" &&
        (!currentEditorData.content[0].content ||
          currentEditorData.content[0].content.length === 0));

    if (isEmptyContent) {
      setError("Blog content cannot be empty.");
      return;
    }
    if (!coverImageFile) {
      setError("Cover image is required.");
      return;
    }
    if (!coverImageAltText.trim()) {
      // Validation for alt text
      setError("Cover image alt text is required for accessibility and SEO.");
      return;
    }
    if (videoUploading) {
      setError("Please wait for video upload to complete.");
      return;
    }

    setIsPublishing(true);
    let createdBlogDocId: string | null = null;
    let uploadedContentStoragePath: string | null = null;
    let uploadedCoverImageStoragePath: string | null = null;
    // const uploadedTiptapImagePaths: string[] = []; // This variable is declared but not explicitly used to store paths. The logic for moving images is within `traverseAndProcessImages`.

    try {
      const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;
      if (!restaurantId) {
        throw new Error(
          "Restaurant ID is not configured. Check environment variables."
        );
      }

      let coverImageDownloadURL: string | null = null;
      let coverImageStoragePath: string | null = null;

      // Upload cover image
      const coverImageFileName = `${Date.now()}_${coverImageFile.name}`;
      const coverPath = `restaurant_assets/${restaurantId}/blog_covers/${coverImageFileName}`;
      const coverRef = storageRef(storage, coverPath);
      uploadedCoverImageStoragePath = coverPath; // Store path for potential rollback

      await uploadBytes(coverRef, coverImageFile);
      coverImageDownloadURL = await getDownloadURL(coverRef);
      coverImageStoragePath = coverPath;
      console.log("Cover image uploaded:", coverImageDownloadURL);

      const blogPostData: any = {
        title: title,
        archived: postArchived,
        coverImage: coverImageDownloadURL,
        coverImageAltText: coverImageAltText, // Include alt text in Firestore data
        coverImageStoragePath: coverImageStoragePath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add video data if available
      if (videoDownloadURL && videoStoragePath) {
        blogPostData.videoUrl = videoDownloadURL;
        blogPostData.videoStoragePath = videoStoragePath;
      }

      // Add blog document to Firestore
      const blogDocRef = await addDoc(
        collection(db, `Restaurants/${restaurantId}/blogs`),
        blogPostData
      );
      createdBlogDocId = blogDocRef.id;

      // Process and upload Tiptap editor images, then update content JSON
      const finalEditorContent = await (async (
        contentJson: JSONContent | null,
        blogId: string
      ) => {
        if (!contentJson || !contentJson.content) return contentJson;

        const newContentJson = JSON.parse(JSON.stringify(contentJson));

        // Helper to traverse and process image nodes within editor content
        const traverseAndProcessImages = async (nodes: any[]) => {
          for (const node of nodes) {
            if (node.type === "image" && node.attrs && node.attrs.src) {
              const src = node.attrs.src;
              // Check if it's an image from our temporary upload folder (from Tiptap's image plugin)
              if (
                src.includes(
                  `/restaurant_assets/${restaurantId}/tiptap_temp_images/`
                )
              ) {
                const oldRef = storageRef(storage, src);
                const fileName = oldRef.name;

                // Define the new permanent path for the image
                const newPath = `restaurant_assets/${restaurantId}/blog_content/${blogId}/blogImages/${fileName}`;
                const newImageRef = storageRef(storage, newPath);

                try {
                  // Fetch the image blob from the temporary URL
                  const blob = await fetch(src).then((res) => res.blob());
                  // Upload the blob to the new permanent path
                  await uploadBytes(newImageRef, blob);
                  const newDownloadURL = await getDownloadURL(newImageRef);

                  // uploadedTiptapImagePaths.push(newPath); // This line can be used if you need to track these paths explicitly for rollback

                  // Update the Tiptap node's src attribute to the new permanent URL
                  node.attrs.src = newDownloadURL;

                  // Delete the original temporary file
                  await deleteObject(oldRef);
                  console.log(
                    `Moved Tiptap image from temporary to permanent: ${src} -> ${newDownloadURL}`
                  );
                } catch (imageMoveError) {
                  console.error(
                    `Failed to move Tiptap image ${src}:`,
                    imageMoveError
                  );
                  throw new Error(
                    `Failed to move Tiptap image ${fileName} to final location. Publishing aborted.`
                  );
                }
              }
            }
            // Recursively process nested content (e.g., if an image is inside a list item)
            if (node.content) {
              await traverseAndProcessImages(node.content);
            }
          }
        };
        await traverseAndProcessImages(newContentJson.content);
        console.log(newContentJson);
        return newContentJson;
      })(currentEditorData, createdBlogDocId);

      // Convert final editor content to string and upload to Storage
      const contentToSaveString = finalEditorContent
        ? JSON.stringify(finalEditorContent)
        : JSON.stringify({ type: "doc", content: [] });
      const contentFileName = `content.json`;
      const contentPath = `restaurant_assets/${restaurantId}/blog_content/${createdBlogDocId}/${contentFileName}`;
      uploadedContentStoragePath = contentPath;

      const contentFileRef = storageRef(storage, contentPath);
      await uploadString(contentFileRef, contentToSaveString, "raw", {
        contentType: "application/json",
      });

      // Update the blog document with the content storage path
      await updateDoc(
        doc(db, `Restaurants/${restaurantId}/blogs`, createdBlogDocId),
        {
          contentStoragePath: contentPath,
        }
      );

      setSuccessMessage("Blog post published successfully!");

      // Clear form fields after successful publish
      setTitle("");
      setEditorContent(null);
      setCoverImageFile(null);
      setCoverImageAltText("");
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setVideoDownloadURL(null);
      setVideoStoragePath(null);
      setVideoUploadProgress(0);
      if (formRef.current) formRef.current.reset();
      if (coverImageInputRef.current) coverImageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    } catch (err) {
      console.error("Error during publishing process: ", err);
      const publishError =
        err instanceof Error
          ? `Failed to publish post: ${err.message}`
          : "An unknown error occurred during publishing.";
      setError(publishError);

      // Rollback logic in case of failure
      if (createdBlogDocId && process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID) {
        const currentRestaurantId =
          process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;
        console.warn(
          `Attempting to roll back blog creation for ID: ${createdBlogDocId}`
        );
        try {
          // Delete main blog document
          await deleteDoc(
            doc(
              db,
              `Restaurants/${currentRestaurantId}/blogs`,
              createdBlogDocId
            )
          );
          console.log(
            `Successfully rolled back (deleted) blog document: ${createdBlogDocId}`
          );
          setError(`${publishError} (Blog document creation was rolled back.)`);

          // Attempt to delete uploaded content.json from Storage if its path was set
          if (uploadedContentStoragePath) {
            console.warn(
              `Attempting to roll back content JSON from Storage: ${uploadedContentStoragePath}`
            );
            const contentToDeleteRef = storageRef(
              storage,
              uploadedContentStoragePath
            );
            await deleteStorageObject(contentToDeleteRef)
              .then(() => {
                console.log(
                  "Successfully deleted content JSON from storage during rollback."
                );
              })
              .catch((storageDeleteError) => {
                console.error(
                  "Failed to delete content JSON from storage during rollback:",
                  storageDeleteError
                );
                setError(
                  (prev) =>
                    `${prev} Failed to delete content file from storage.`
                );
              });
          }
          // TODO: Add logic to delete uploaded cover image and video if they were successfully uploaded
          // and then a subsequent step failed. This would involve checking uploadedCoverImageStoragePath
          // and videoStoragePath and attempting to delete them.
          if (uploadedCoverImageStoragePath) {
            console.warn(
              `Attempting to roll back cover image from Storage: ${uploadedCoverImageStoragePath}`
            );
            const coverImageToDeleteRef = storageRef(
              storage,
              uploadedCoverImageStoragePath
            );
            await deleteStorageObject(coverImageToDeleteRef)
              .then(() => {
                console.log(
                  "Successfully deleted cover image from storage during rollback."
                );
              })
              .catch((storageDeleteError) => {
                console.error(
                  "Failed to delete cover image from storage during rollback:",
                  storageDeleteError
                );
                setError(
                  (prev) =>
                    `${prev} Failed to delete cover image file from storage.`
                );
              });
          }
          if (videoStoragePath) {
            // Note: this path might be a 'temp_video' path.
            console.warn(
              `Attempting to roll back video from Storage: ${videoStoragePath}`
            );
            const videoToDeleteRef = storageRef(storage, videoStoragePath);
            await deleteStorageObject(videoToDeleteRef)
              .then(() => {
                console.log(
                  "Successfully deleted video from storage during rollback."
                );
              })
              .catch((storageDeleteError) => {
                console.error(
                  "Failed to delete video from storage during rollback:",
                  storageDeleteError
                );
                setError(
                  (prev) => `${prev} Failed to delete video file from storage.`
                );
              });
          }
        } catch (rollbackError) {
          console.error(
            `Failed to roll back blog document for ID: ${createdBlogDocId}`,
            rollbackError
          );
          setError(
            `${publishError} (Additionally, failed to roll back blog document. Please check Firestore & Storage.)`
          );
        }
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCoverImageChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setError(null);
    setSuccessMessage(null);
    setImagePreview(null);
    setCoverImageFile(null);

    const files = event.target.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Invalid file type. Please select an image for the cover.");
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
        return;
      }
      // Validate file size
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_SIZE) {
        setError(`Cover image size exceeds ${MAX_SIZE / (1024 * 1024)}MB.`);
        if (coverImageInputRef.current) coverImageInputRef.current.value = "";
        return;
      }
      setCoverImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // try {
      //     const base64 = await convertFileToBase64(file); // This function is no longer needed if directly uploading File object
      //     setCoverImageBase64(base64); // Removed this line
      // } catch (err) {
      //     console.error("Error converting cover image to Base64:", err);
      //     setError(
      //         err instanceof Error
      //             ? `Error processing cover image: ${err.message}`
      //             : "Unknown error processing cover image.",
      //     );
      //     setImagePreview(null);
      //     setCoverImageFile(null);
      //     if (coverImageInputRef.current)
      //         coverImageInputRef.current.value = "";
      // }
    }
  };

  const initialEditorContent: JSONContent = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Start writing your blog post here...",
          },
        ],
      },
    ],
  };

  if (isLoading || profile?.role !== "admin") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 font-creto h-screen overflow-auto flex flex-col bg-neutral-800 no-scrollbar">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-white">
        Create New Blog Post
      </h1>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded fixed right-10 top-20 z-50 mb-4 shadow-lg"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="px-4 text-red-700">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {isPublishing && (
        <div
          className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded fixed right-10 top-20 z-50 mb-4 shadow-lg"
          role="alert"
        >
          <strong className="font-bold">Publishing Blog... </strong>
        </div>
      )}

      {successMessage && (
        <div
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded fixed right-10 top-20 z-50 mb-4 shadow-lg"
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
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded fixed right-10 top-32 z-50 mb-4 shadow-lg"
          role="alert"
        >
          <strong className="font-bold">Video Error: </strong>
          <span className="block sm:inline">{videoError}</span>
          <button
            onClick={() => setVideoError(null)}
            className="px-4 text-red-700"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handlePublish}
        className="mx-auto w-full max-w-4xl flex flex-col flex-grow"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          {/* Column 1 */}
          <div>
            <div className="mb-6">
              <label
                htmlFor="blogTitle"
                className="block text-lg font-medium text-white/80 mb-2"
              >
                Blog Title
              </label>
              <input
                type="text"
                id="blogTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your blog title"
                className="w-full px-4 py-2 border border-primary-dark bg-neutral-700 text-white rounded-md shadow-sm shadow-primary-dark/40 focus:ring-primary focus:border-primary text-base"
                required
              />
            </div>
            <div className="mb-6 flex items-center gap-x-3">
              <input
                type="checkbox"
                id="archive"
                checked={postArchived}
                onChange={(e) => setPostArchived(e.target.checked)}
                className="w-5 h-5 accent-primary text-primary  border-primary-dark bg-neutral-700  rounded focus:ring-primary"
              />
              <label
                htmlFor="archive"
                className="text-lg font-medium text-white/80"
              >
                Archive Post
              </label>
            </div>
          </div>
          {/* Column 2 */}
          <div className="mb-6">
            <label
              htmlFor="coverImage"
              className="block text-lg font-medium text-white/80 mb-2"
            >
              Cover Image
            </label>
            <input
              type="file"
              id="coverImage"
              accept="image/*"
              onChange={handleCoverImageChange}
              ref={coverImageInputRef}
              className="w-full px-3 py-2 border border-primary-dark bg-neutral-700  rounded-md shadow-sm text-sm shadow-primary-dark/40 text-white/80 
              file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-white hover:file:bg-primary-dark hover:file:text-white"
              required
            />
            {imagePreview && (
              <div className="mt-3">
                <Image
                  src={imagePreview}
                  alt="Cover preview"
                  width={160}
                  height={90}
                  className="rounded-md border border-primary-dark bg-neutral-700  object-cover max-h-24 w-auto"
                />
              </div>
            )}
            {/* New input for Cover Image Alt Text */}
            <div className="mt-4">
              <label
                htmlFor="coverImageAltText"
                className="block text-lg font-medium text-white/80 mb-2"
              >
                Cover Image Alt Text
              </label>
              <input
                type="text"
                id="coverImageAltText"
                value={coverImageAltText}
                onChange={(e) => setCoverImageAltText(e.target.value)}
                placeholder="Describe the cover image for accessibility"
                className="w-full px-4 py-2 border border-primary-dark bg-neutral-700 text-white/80 rounded-md shadow-sm shadow-primary-dark/40 focus:ring-primary focus:border-primary text-base"
                required
              />
            </div>
          </div>
        </div>

        {/* Video Upload Section - Full Width */}
        <div className="mb-6">
          <label
            htmlFor="blogVideo"
            className="block text-lg font-medium text-white/80 mb-2"
          >
            Blog Video (Optional)
          </label>
          <input
            type="file"
            id="blogVideo"
            accept="video/*"
            onChange={handleVideoChange}
            ref={videoInputRef}
            className="w-full px-3 py-2 border border-primary-dark bg-neutral-700  rounded-md shadow-sm text-sm shadow-primary-dark/40 text-white/80 
              file:mr-2 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-white hover:file:bg-primary-dark hover:file:text-white"
          />
          {videoUploading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${videoUploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center text-gray-600 mt-1">
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
                className="rounded-md border border-primary-dark bg-neutral-700  max-h-48 w-auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          {videoDownloadURL && !videoUploading && (
            <p className="mt-1 text-xs text-green-600">
              Video ready. Save post to apply.
            </p>
          )}
        </div>

        {/* info for admins */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            <p className="text-md text-grey">Note for Admins:</p>
            <li>
              Kindly confirm that the blog has been published by checking if the
              blog is shown on the blogs page after getting the successfully
              uploaded message.
            </li>
            <li>
              Whenever making a new blog archive it, so that it will not be
              shown to users as the blog content page will not exist at that
              point in time.
            </li>
          </p>
        </div>

        <div className="mb-6 flex-grow flex flex-col h-full p-4 md:p-6 bg-white/80 shadow-lg rounded-lg border border-gray-200">
          <label className="block text-lg font-medium text-black mb-2">
            Blog Content
          </label>
          <div className="min-h-[300px] md:min-h-[400px] no-scrollbar tiptap-editor-container">
            <SimpleEditor
              key={editorContent ? "editor-with-content" : "editor-empty"}
              initialContent={editorContent || initialEditorContent}
              onContentChange={handleContentChange}
            />
          </div>
        </div>
      </form>

      <div className="flex justify-end items-center mt-auto pt-6 pb-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => formRef.current?.requestSubmit()}
          disabled={isPublishing || videoUploading}
          className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold text-lg rounded-md shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing
            ? "Publishing..."
            : videoUploading
              ? "Uploading Video..."
              : "Publish Post"}
        </button>
      </div>
    </div>
  );
};

export default CreateBlogPage;
