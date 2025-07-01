// app/blogs/[id]/BlogDisplayClient.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image as TiptapImageExtension } from "@tiptap/extension-image";
import { Link as TiptapLinkExtension } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { Underline } from "@tiptap/extension-underline";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import Spinner from "@/components/Spinner";
import { useEffect, useState, useRef } from "react";

import { doc, getDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/ClientApp";

import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";
import customImage from "@/components/tiptap/tiptap-templates/simple/customImage";
import useUser from "@/hooks/useUser";
import ThemeButton from "@/components/ThemeBtn";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export interface BlogMetadataForClient {
  id: string;
  title: string;
  coverImage?: string;
  createdAt: string;
  updatedAt?: string;
  restaurantId: string;
  videoUrl?: string;
  archived?: boolean;
  contentStoragePath?: string;
  ViewCount: number | undefined;
}

interface BlogDisplayClientProps {
  blogMetadata: BlogMetadataForClient | null;
}

const BlogDisplayClient: React.FC<BlogDisplayClientProps> = ({
  blogMetadata,
}) => {
  const router = useRouter();
  const storage = getStorage();

  const [blogContent, setBlogContent] = useState<JSONContent | null>(null);
  const [contentLoading, setContentLoading] = useState<boolean>(true);
  const [contentError, setContentError] = useState<string | null>(null);

  const [isMainVideoVisible, setIsMainVideoVisible] = useState(true);
  const [isMainVideoPlaying, setIsMainVideoPlaying] = useState(false);
  const [isVideoPoppedOut, setIsVideoPoppedOut] = useState(false);

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const popOutVideoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const programmaticMainPauseRef = useRef(false); // Flag for programmatic pause of main video

  const videoUrlFromProps = blogMetadata?.videoUrl;

  const [theme, setTheme] = useState("light");

  // theme management useeffect
  useEffect(() => {
    // On mount, read the theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    if (
      !blogMetadata ||
      !blogMetadata.id ||
      !blogMetadata.contentStoragePath ||
      !blogMetadata.restaurantId
    ) {
      if (blogMetadata) {
        setContentError(
          "Required information to fetch blog content is missing."
        );
      }
      setContentLoading(false);
      return;
    }

    const fetchContentFromStorage = async () => {
      setContentLoading(true);
      setContentError(null);
      setBlogContent(null);

      try {
        const pathReference = storageRef(
          storage,
          blogMetadata.contentStoragePath
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
            setContentError(
              "Blog content is malformed and could not be displayed."
            );
            setBlogContent({ type: "doc", content: [] }); // Fallback to empty
            return;
          }

          if (
            parsedJsonContent &&
            typeof parsedJsonContent === "object" &&
            parsedJsonContent.type === "doc" &&
            Array.isArray(parsedJsonContent.content)
          ) {
            setBlogContent(parsedJsonContent);
          } else {
            console.warn(
              "CLIENT: Parsed content from storage is not a valid Tiptap 'doc':",
              parsedJsonContent
            );
            setContentError("Blog content format from storage is invalid.");
            setBlogContent({ type: "doc", content: [] }); // Fallback
          }
        } else {
          setContentError("Blog content file from storage is empty.");
          setBlogContent({ type: "doc", content: [] }); // Fallback
        }
      } catch (err) {
        console.error("CLIENT: Error fetching blog content from storage:", err);
        setContentError(
          err instanceof Error
            ? `Failed to load content: ${err.message}`
            : "An unknown error occurred while fetching content."
        );
        setBlogContent({ type: "doc", content: [] }); // Fallback
      } finally {
        setContentLoading(false);
      }
    };

    fetchContentFromStorage();
  }, [blogMetadata, storage]);

  const editor = useEditor(
    {
      editable: false,
      content: blogContent || { type: "doc", content: [] },
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3, 4, 5, 6] },
        }),
        customImage.configure({
          allowBase64: true,
          inline: false,
        }),

        TiptapLinkExtension.configure({
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Typography,
        Highlight.configure({ multicolor: true }),
        Subscript,
        Superscript,
        Underline,
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none",
        },
      },
    },
    []
  );

  useEffect(() => {
    if (editor && blogContent) {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(blogContent)) {
        editor.commands.setContent(blogContent);
      }
    } else if (editor && !blogContent && !contentLoading && !contentError) {
      editor.commands.clearContent();
    }
  }, [editor, blogContent, contentLoading, contentError]);

  // Intersection Observer for main video visibility
  useEffect(() => {
    const container = videoContainerRef.current;
    if (
      !container ||
      typeof videoUrlFromProps !== "string" ||
      !videoUrlFromProps.startsWith("http")
    ) {
      if (videoUrlFromProps)
        console.warn(
          "Invalid videoUrlFromProps for IntersectionObserver:",
          videoUrlFromProps
        );
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsMainVideoVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(container);
    return () => {
      if (container) observer.unobserve(container);
    };
  }, [videoUrlFromProps]);

  // Event listeners for the main video player
  useEffect(() => {
    const video = mainVideoRef.current;
    if (
      !video ||
      typeof videoUrlFromProps !== "string" ||
      !videoUrlFromProps.startsWith("http")
    ) {
      return;
    }

    const handlePlay = () => {
      // User/autoplay initiated play on main video
      if (!isVideoPoppedOut) {
        // Only update if main video is the active one
        setIsMainVideoPlaying(true);
      }
    };

    const handlePause = () => {
      // User initiated pause on main video or video ended
      if (!programmaticMainPauseRef.current && !isVideoPoppedOut) {
        setIsMainVideoPlaying(false);
      }
      programmaticMainPauseRef.current = false; // Reset flag after any pause
    };

    video.addEventListener("play", handlePlay);
    video.addEventListener("playing", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause); // Treat ended as a pause for playback intent

    // Initial state is false, playback is started by user or autoplay which fires 'play'
    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("playing", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
    };
  }, [videoUrlFromProps, isVideoPoppedOut]); // isVideoPoppedOut helps ensure this logic applies correctly

  // Determine if video should be popped out
  useEffect(() => {
    if (
      typeof videoUrlFromProps === "string" &&
      videoUrlFromProps.startsWith("http") &&
      !isMainVideoVisible &&
      isMainVideoPlaying
    ) {
      setIsVideoPoppedOut(true);
    } else {
      setIsVideoPoppedOut(false);
    }
  }, [videoUrlFromProps, isMainVideoVisible, isMainVideoPlaying]);

  // Syncing Main and Pop-out Videos
  useEffect(() => {
    const mainVideo = mainVideoRef.current;
    const popOut = popOutVideoRef.current;

    if (
      !mainVideo ||
      !popOut ||
      typeof videoUrlFromProps !== "string" ||
      !videoUrlFromProps.startsWith("http")
    ) {
      return;
    }

    const playVideoAsync = async (
      videoElement: HTMLVideoElement,
      isPlayingMain: boolean
    ) => {
      try {
        await videoElement.play();
        if (
          isPlayingMain &&
          videoElement === mainVideo &&
          !videoElement.paused
        ) {
          // If main video is successfully played programmatically, ensure its state is true
          setIsMainVideoPlaying(true);
        }
      } catch (error) {
        const domError = error as DOMException;
        if (domError.name !== "AbortError") {
          console.warn(
            `${videoElement === mainVideo ? "Main" : "Pop-out"} video play() failed:`,
            domError
          );
        }
      }
    };

    if (isVideoPoppedOut) {
      // Transition to pop-out
      const mainVidCurrentTime = mainVideo.currentTime;
      const mainVidIsMuted = mainVideo.muted;
      const mainShouldBePlaying = isMainVideoPlaying; // Capture intent *before* pausing main

      if (!mainVideo.paused) {
        programmaticMainPauseRef.current = true; // Signal programmatic pause
        mainVideo.pause();
      }

      popOut.currentTime = mainVidCurrentTime;
      popOut.muted = mainVidIsMuted;

      if (mainShouldBePlaying) {
        playVideoAsync(popOut, false);
      }
    } else {
      // Transition back to main video
      const popOutCurrentTime = popOut.currentTime;
      const popOutIsMuted = popOut.muted;
      const popOutWasPlaying = !popOut.paused;

      if (!popOut.paused) {
        popOut.pause();
      }

      if (isMainVideoVisible) {
        mainVideo.currentTime = popOutCurrentTime;
        mainVideo.muted = popOutIsMuted;
        // Play main if pop-out was playing OR if global intent is to play and main is currently paused.
        if (popOutWasPlaying) {
          playVideoAsync(mainVideo, true);
        } else if (!isMainVideoPlaying && !mainVideo.paused) {
          // If global intent is false, but main somehow unpaused, pause it.
          mainVideo.pause();
        }
      }
    }
  }, [
    isVideoPoppedOut,
    videoUrlFromProps,
    isMainVideoVisible,
    isMainVideoPlaying,
  ]);

  if (!blogMetadata) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-primary">
        <p className="mt-4 text-xl">Blog metadata is not available.</p>
        <button
          onClick={() => router.push("/blogs")}
          className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Blogs
        </button>
      </div>
    );
  }

  const parseDateString = (dateString: string | undefined): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  const createdAtDate = parseDateString(blogMetadata.createdAt);
  const updatedAtDate = parseDateString(blogMetadata.updatedAt);

  const { profile } = useUser();

  return (
    <div className={`font-creto overflow-y-auto dark:bg-black bg-white`}>
      <article className="dark:bg-neutral-800 shadow-xl rounded-lg bg-white text-gray-900 dark:text-gray-50">
        <div className="flex flex-col sm:flex-row px-8 pt-4 sm:pt-6 md:pt-8 max-w-4xl mx-auto">
          {blogMetadata.coverImage && (
            <div className="relative w-full h-64 md:h-96 mb-6 sm:mb-0">
              <Image
                src={blogMetadata.coverImage}
                alt={blogMetadata.title || "Blog post cover image"}
                layout="fill"
                objectFit="cover"
                className="rounded-3xl"
                priority
                unoptimized={true}
              />
            </div>
          )}
          <div
            className={`p-4 sm:p-6 md:p-8 flex flex-col justify-center items-start ${blogMetadata.coverImage ? "sm:ml-6" : "w-full"}`}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {blogMetadata.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-200 mb-6 border-b pb-4">
              Published on:{" "}
              {createdAtDate?.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {updatedAtDate &&
                blogMetadata.updatedAt &&
                blogMetadata.createdAt &&
                updatedAtDate.getTime() !== createdAtDate?.getTime() && (
                  <span className="ml-4 italic">
                    (Updated:{" "}
                    {updatedAtDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    )
                  </span>
                )}
            </p>
            {profile?.role === "admin" && (
              <p className="text-sm text-gray-500 dark:text-gray-200 mb-6 border-b pb-4">
                Total Views:{" "}
                {blogMetadata.ViewCount !== undefined
                  ? blogMetadata.ViewCount
                  : "N/A"}
              </p>
            )}
          </div>
        </div>

        {typeof videoUrlFromProps === "string" &&
          videoUrlFromProps.startsWith("http") && (
            <div
              ref={videoContainerRef}
              className="my-6 max-w-3xl mx-auto px-4 sm:px-0"
            >
              <video
                ref={mainVideoRef}
                src={videoUrlFromProps}
                controls
                playsInline
                className="max-h-[80vh] mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}

        <div
          className={`p-6 md:p-10 sm:px-20 md:max-w-3xl transition-all duration-500 ease-in-out ${isVideoPoppedOut ? "md:ml-[286px] mx-auto" : "mx-auto"}`}
        >
          <div className="tiptap-rendered-content ">
            <EditorContent editor={editor} />
            {blogContent == null && contentLoading && (
              <div className="h-[200px] opacity-20 flex justify-center items-center">
                <Spinner />
              </div>
            )}
            {contentError && !contentLoading && (
              <div
                className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Content Error:</span>{" "}
                {contentError}
              </div>
            )}
          </div>
        </div>
      </article>

      {typeof videoUrlFromProps === "string" &&
        videoUrlFromProps.startsWith("http") && (
          <div
            className={`fixed bottom-5 left-5 w-[calc(100vw-2.5rem)] max-w-[250px] z-50 shadow-2xl rounded-lg overflow-hidden aspect-video md:aspect-auto bg-black
                        transition-all duration-500 ease-in-out
                        ${isVideoPoppedOut ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full pointer-events-none"}`}
            aria-label="Pop-out video player"
            role="region"
          >
            <video
              ref={popOutVideoRef}
              src={videoUrlFromProps}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        )}

      <div className="my-8 text-center flex justify-between mx-10">
        <button
          onClick={() => router.push("/blogs")}
          className="px-6 py-2 bg-gray-200 dark:bg-white/20 dark:text-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-white/40 transition-colors"
        >
          &larr; Back to All Blogs
        </button>

        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default BlogDisplayClient;
