// app/blogs/[id]/edit/page.tsx

import { db } from "@/lib/firebase/ClientApp";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  Timestamp,
} from "firebase/firestore";
import { notFound } from "next/navigation";
import BlogEditFormClient from "./BlogEditFormClient";

// Styles (can be imported here or in the client component, or globally)
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap/tiptap-templates/simple/simple-editor.scss";
import { BlogMetadataForClient } from "../BlogDisplayClient";

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;
  console.log(
    `[EditPage - generateStaticParams] Using Restaurant ID: ${restaurantId}`
  );

  if (!restaurantId) {
    console.error(
      "[EditPage - generateStaticParams] CRITICAL ERROR: Restaurant ID is not configured."
    );
    return [];
  }

  try {
    const blogsCollectionRef = collection(
      db,
      `Restaurants/${restaurantId}/blogs`
    );
    const querySnapshot = await getDocs(blogsCollectionRef);
    console.log(
      `[EditPage - generateStaticParams] Fetched ${querySnapshot.docs.length} blog documents for restaurant ${restaurantId}.`
    );

    if (querySnapshot.empty) {
      console.warn(
        `[EditPage - generateStaticParams] No blog documents found for restaurant ${restaurantId}.`
      );
    }

    const params = querySnapshot.docs.map((doc) => {
      console.log(
        `[EditPage - generateStaticParams] Found blog ID for static generation: ${doc.id}`
      );
      return { id: doc.id };
    });
    return params;
  } catch (error) {
    console.error(
      "[EditPage - generateStaticParams] Error fetching paths from Firestore:",
      error
    );
    return [];
  }
}

// Fetches only the blog metadata (including contentDocId) at build time.
async function getBlogMetadataForEditServer(
  blogId: string,
  restaurantId: string | undefined
): Promise<BlogMetadataForClient | null> {
  console.log(
    `[EditPage - getBlogMetadata] Fetching metadata for blog ID: ${blogId}, Restaurant ID: ${restaurantId}`
  );
  if (!restaurantId) {
    console.error(
      `[EditPage - getBlogMetadata] Restaurant ID missing for blog ${blogId}.`
    );
    return null;
  }

  try {
    const blogMetaDocRef = doc(db, `Restaurants/${restaurantId}/blogs`, blogId);
    const blogMetaSnap = await getDoc(blogMetaDocRef);

    if (!blogMetaSnap.exists()) {
      console.warn(
        `[EditPage - getBlogMetadata] Blog metadata not found for ID: ${blogId}`
      );
      return null;
    }
    const metaData = blogMetaSnap.data();
    const contentDocId = metaData.blogId as string;

    const contentStoragePath = metaData.contentStoragePath as
      | string
      | undefined;

    if (contentStoragePath) {
      console.log(
        `SERVER: Content storage path from metadata: ${contentStoragePath}`
      );
    } else {
      console.warn(
        `SERVER: 'contentStoragePath' field not found or is empty in blog metadata for blog: ${blogId}. The blog might not have content or the field is missing.`
      );
    }

    return {
      id: blogMetaSnap.id,
      title: metaData.title || "Untitled Post",
      archived: metaData.archive || false,
      videoUrl: metaData.videoUrl || undefined,
      coverImage: metaData.coverImage || undefined,
      contentStoragePath: metaData.contentStoragePath || undefined,
      restaurantId: restaurantId,
      createdAt:
        (metaData.createdAt as Timestamp)?.toDate().toISOString() ||
        new Date().toISOString(),
      ViewCount: metaData.views || 0,
    };
  } catch (err) {
    console.error(
      `[EditPage - getBlogMetadata] Error fetching metadata for blog ID ${blogId}:`,
      err
    );
    return null;
  }
}

type Params = Promise<{ id: string }>;

// The Page component is a Server Component.
export default async function EditBlogPageServer({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  const initialMetadata = await getBlogMetadataForEditServer(id, restaurantId);

  if (!initialMetadata) {
    console.log(
      `[EditPageServer] Initial blog metadata not found for ID: ${id}. Triggering 404.`
    );
    notFound();
  }

  // Pass the fetched initial metadata to the Client Component.
  // The Client Component will then fetch the actual Tiptap content.
  return <BlogEditFormClient initialMetadata={initialMetadata} />;
}
