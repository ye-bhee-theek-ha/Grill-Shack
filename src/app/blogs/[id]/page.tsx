// app/blogs/[id]/page.tsx

import BlogDisplayClient, { BlogMetadataForClient } from "./BlogDisplayClient";
import Spinner from "@/components/Spinner";

// Stylesheets
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap/tiptap-templates/simple/simple-editor.scss";

import { db } from "@/lib/firebase/ClientApp";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { Metadata } from "next";

type Params = Promise<{ id: string }>;

// Function to fetch blog metadata on the server
async function getBlogMetadata(
  id: string
): Promise<BlogMetadataForClient | null> {
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  if (!restaurantId) {
    console.error(
      "SERVER: Restaurant configuration error: NEXT_PUBLIC_FIREBASE_RESTAURANT_ID is not set in page.tsx."
    );
    return null;
  }
  console.log(
    `SERVER: Attempting to fetch blog metadata for ID: ${id}, Restaurant ID: ${restaurantId}`
  );

  const blogDocRef = doc(db, `Restaurants/${restaurantId}/blogs`, id);
  const blogDocSnap = await getDoc(blogDocRef);

  if (!blogDocSnap.exists()) {
    console.warn(
      `SERVER: Blog metadata document not found for ID: ${id} at path: Restaurants/${restaurantId}/blogs/${id}`
    );
    return null;
  }

  const blogMetadata = blogDocSnap.data();
  // console.log("SERVER: Fetched blog metadata (raw):", blogMetadata);

  const contentStoragePath = blogMetadata.contentStoragePath as
    | string
    | undefined;

  if (contentStoragePath) {
    console.log(
      `SERVER: Content storage path from metadata: ${contentStoragePath}`
    );
  } else {
    console.warn(
      `SERVER: 'contentStoragePath' field not found or is empty in blog metadata for blog: ${id}. The blog might not have content or the field is missing.`
    );
  }

  const createdAtTimestamp = blogMetadata.createdAt as Timestamp;
  const updatedAtTimestamp = blogMetadata.updatedAt as Timestamp | undefined;

  if (!(createdAtTimestamp instanceof Timestamp)) {
    console.error(
      `SERVER: createdAt field is not a valid Firestore Timestamp for blog ID: ${id}. Received:`,
      blogMetadata.createdAt
    );
    return null;
  }

  return {
    id: blogDocSnap.id, // ID of the main blog document
    title: (blogMetadata.title as string) || "Untitled Post",
    coverImage: blogMetadata.coverImage as string | undefined,
    createdAt: createdAtTimestamp.toDate().toISOString(),
    updatedAt: updatedAtTimestamp
      ? updatedAtTimestamp.toDate().toISOString()
      : undefined,
    contentStoragePath: contentStoragePath,
    restaurantId: restaurantId,
    videoUrl: blogMetadata.videoUrl as string | undefined,
    archived: blogMetadata.archived as boolean | undefined,
    ViewCount: blogMetadata.views as number | undefined,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const blogId = id;
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  if (!blogId || !restaurantId) {
    return {
      title: "Blog Post Not Found",
    };
  }
  try {
    const docRef = doc(db, `Restaurants/${restaurantId}/blogs`, blogId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        title: (data.title as string) || "Blog Post",
        description: `Read the blog post: ${(data.title as string) || "Untitled"}`,
        openGraph: data.coverImage
          ? { images: [data.coverImage as string] }
          : undefined,
      };
    } else {
      return {
        title: "Blog Post Not Found",
      };
    }
  } catch (error) {
    console.error(
      `SERVER: Error fetching metadata for blog post [${blogId}]:`,
      error
    );
    return {
      title: "Error Loading Blog Post",
    };
  }
}

export async function generateStaticParams() {
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  if (!restaurantId) {
    console.error(
      "SERVER: Missing NEXT_PUBLIC_FIREBASE_RESTAURANT_ID. Cannot generate static blog paths for page.tsx."
    );
    return [];
  }

  try {
    const blogsRef = collection(db, `Restaurants/${restaurantId}/blogs`);
    const blogSnapshot = await getDocs(blogsRef);

    if (blogSnapshot.empty) {
      console.warn(
        `SERVER: No blogs found for restaurant ID [${restaurantId}] during generateStaticParams.`
      );
      return [];
    }

    const paths = blogSnapshot.docs.map((doc) => ({
      id: doc.id,
    }));
    console.log(
      "SERVER: Generated static paths for blogs:",
      paths.map((p) => p.id)
    );
    return paths;
  } catch (error) {
    console.error(
      "SERVER: Error fetching blogs for static paths in page.tsx:",
      error
    );
    return [];
  }
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const blogId = id;
  let blogMetadataProps: BlogMetadataForClient | null = null;
  let fetchError: string | null = null;

  if (!blogId) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-primary">
        <p className="mt-4 text-xl">Blog ID is missing.</p>
      </div>
    );
  }

  console.log(`SERVER: BlogPostPage rendering for blogId: ${blogId}`);

  try {
    blogMetadataProps = await getBlogMetadata(blogId);
    if (blogMetadataProps && process.env.NODE_ENV === "production") {
      const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;
      if (restaurantId) {
        const blogDocRef = doc(db, `Restaurants/${restaurantId}/blogs`, blogId);
        await updateDoc(blogDocRef, {
          views: increment(1),
        });
      }
    }
  } catch (err) {
    console.error(
      `SERVER: Critical error fetching blog metadata for ID [${blogId}] in BlogPostPage:`,
      err
    );
    fetchError =
      "An unexpected error occurred while trying to load the blog post metadata.";
  }

  if (fetchError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center">
        <p className="text-xl text-red-600 bg-red-100 border border-red-400 px-4 py-3 rounded mb-4">
          Error: {fetchError}
        </p>
      </div>
    );
  }

  if (!blogMetadataProps) {
    console.log(
      `SERVER: No blog metadata resolved for blogId [${blogId}]. Rendering 'not found' message.`
    );
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-primary">
        <p className="mt-4 text-xl">
          The blog post metadata could not be found (ID: {blogId}). This might
          be due to a missing record or configuration issue.
        </p>
      </div>
    );
  }

  console.log(
    `SERVER: Successfully fetched blog metadata for [${blogId}], passing to BlogDisplayClient.`
  );
  return <BlogDisplayClient blogMetadata={blogMetadataProps} />;
}
