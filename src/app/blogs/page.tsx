// app/blogs/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Added useCallback
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  Query,
} from "firebase/firestore";
import Image from "next/image";
import Spinner from "@/components/Spinner";
import { db } from "@/lib/firebase/ClientApp";
import useUser from "@/hooks/useUser";

// Icon components (assuming they are in the same file or correctly imported)
interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const GridIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-layout-grid ${className}`}
    {...props}
  >
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const ListIcon: React.FC<IconProps> = ({
  size = 24,
  className = "",
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`lucide lucide-list ${className}`}
    {...props}
  >
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

const EditIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

interface BlogPost {
  id: string;
  title: string;
  coverImage?: string;
  createdAt: Timestamp;
  archived?: boolean;
}

type ViewMode = "grid" | "list";
const POSTS_PER_PAGE = 8;

const BlogsPage = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  const fetchBlogCount = useCallback(async () => {
    if (!restaurantId) {
      console.error("Restaurant ID is not configured for fetching count.");
      return;
    }
    try {
      const blogsCollectionRef = collection(
        db,
        `Restaurants/${restaurantId}/blogs`
      );
      const snapshot = await getCountFromServer(blogsCollectionRef);
      setTotalPosts(snapshot.data().count);
    } catch (err) {
      console.error("Error fetching blog count:", err);
      setError("Could not fetch total blog posts.");
    }
  }, [restaurantId]);

  const fetchBlogData = useCallback(
    async (direction: "initial" | "next" | "prev") => {
      if (!restaurantId) {
        setError("Configuration error: Restaurant ID missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const blogsCollectionRef = collection(
          db,
          `Restaurants/${restaurantId}/blogs`
        );
        let q: Query<DocumentData> | undefined = undefined;

        if (direction === "initial") {
          q = query(
            blogsCollectionRef,
            orderBy("createdAt", "desc"),
            limit(POSTS_PER_PAGE)
          );
          setCurrentPage(1);
        } else if (direction === "next") {
          if (lastVisible) {
            q = query(
              blogsCollectionRef,
              orderBy("createdAt", "desc"),
              startAfter(lastVisible),
              limit(POSTS_PER_PAGE)
            );
          } else {
            // This state should ideally be prevented by disabling the 'next' button
            setError(
              "Cannot fetch next page: no reference point (lastVisible is null)."
            );
            setLoading(false);
            return;
          }
        } else if (direction === "prev") {
          if (firstVisible) {
            q = query(
              blogsCollectionRef,
              orderBy("createdAt", "desc"),
              endBefore(firstVisible),
              limitToLast(POSTS_PER_PAGE)
            );
          } else {
            // This state should ideally be prevented by disabling the 'prev' button
            setError(
              "Cannot fetch previous page: no reference point (firstVisible is null)."
            );
            setLoading(false);
            return;
          }
        }

        if (!q) {
          // This case should ideally not be reached if direction is one of the expected values
          // and the logic for 'next'/'prev' correctly handles missing cursors.
          console.error(
            `Query construction failed for direction: ${direction}. This indicates an unexpected state.`
          );
          setError(
            "An internal error occurred while preparing to fetch blogs. Invalid direction or state."
          );
          setLoading(false);
          return;
        }

        const querySnapshot = await getDocs(q);
        const fetchedBlogs: BlogPost[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedBlogs.push({
            id: doc.id,
            title: data.title || "Untitled Post",
            coverImage: data.coverImage,
            createdAt: data.createdAt as Timestamp,
            archived: data.archived || false,
          });
          console.log(doc.data(), doc.id);
        });

        if (querySnapshot.docs.length > 0) {
          setFirstVisible(querySnapshot.docs[0]);
          setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
          setBlogs(fetchedBlogs);
          if (direction === "next") setCurrentPage((prev) => prev + 1);
          if (direction === "prev")
            setCurrentPage((prev) => Math.max(1, prev - 1)); // Ensure page doesn't go below 1
        } else {
          if (direction === "initial") {
            setBlogs([]);
          }
          // If 'next' or 'prev' yields no documents, it means we're at the respective end.
          // The button disabling logic should handle this.
          // No change to 'blogs' state here if it's not an initial load, to keep current items if any.
        }
      } catch (err) {
        console.error("Error fetching blogs: ", err);
        if (err instanceof Error) {
          setError(`Failed to load blogs: ${err.message}`);
        } else {
          setError("An unknown error occurred while fetching blogs.");
        }
        setBlogs([]); // Clear blogs on error
      } finally {
        setLoading(false);
      }
    },
    [restaurantId, lastVisible, firstVisible]
  );

  useEffect(() => {
    fetchBlogData("initial");
    fetchBlogCount();
  }, []);

  const totalPages =
    totalPosts > 0 ? Math.ceil(totalPosts / POSTS_PER_PAGE) : 1;

  const { profile } = useUser();

  // Conditional rendering for loading and error states (handled by the main return)
  if (loading && blogs.length === 0 && currentPage === 1) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-primary">
        <Spinner color="currentColor" />
        <p className="mt-4 text-xl">Loading Blogs...</p>
      </div>
    );
  }

  if (error && blogs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen p-4">
        <p className="text-xl text-red-600 bg-red-100 border border-red-400 px-4 py-3 rounded mb-4">
          Error: {error}
        </p>
        {!restaurantId && (
          <p className="text-sm text-gray-50 mt-2">
            Hint: Restaurant ID might be missing in environment variables.
          </p>
        )}
      </div>
    );
  }

  const commonLinkClasses =
    "block bg-neutral-600 rounded-xl shadow-primary/20 shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden group";

  return (
    <>
      <div className="container mx-auto p-4 md:p-8 font-creto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl md:text-5xl text-white font-awakening">
            Our Blogs
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              aria-label="Switch to Grid View"
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === "grid"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <GridIcon size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              aria-label="Switch to List View"
              className={`p-2 rounded-md transition-colors duration-200 ${
                viewMode === "list"
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <ListIcon size={20} />
            </button>
          </div>
        </div>

        {/* Inline error display if blogs are already loaded but a pagination fetch fails */}
        {error && blogs.length > 0 && (
          <div className="text-center py-4">
            <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>
          </div>
        )}

        {/* Inline loader for pagination fetches when some blogs are already visible */}
        {loading && (blogs.length > 0 || currentPage > 1) && (
          <div className="flex justify-center items-center py-10">
            <Spinner color="currentColor" className="text-primary" />
          </div>
        )}

        {!loading && blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-2xl text-gray-500">No blog posts found yet.</p>
            {process.env.NODE_ENV === "development" && restaurantId && (
              <p className="text-sm text-gray-400 mt-1">
                Checked path: Restaurants/{restaurantId}
                /blogs
              </p>
            )}
            {!restaurantId && process.env.NODE_ENV === "development" && (
              <p className="text-sm text-orange-500 mt-1">
                Warning: Restaurant ID (NEXT_PUBLIC_FIREBASE_RESTAURANT_ID) is
                not set.
              </p>
            )}
          </div>
        ) : !loading && blogs.length > 0 ? (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map(
                  (blog, index) =>
                    (!blog.archived || profile?.role === "admin") &&
                    blog.id != "HhrqYszvCsMXXo2gywSO" && (
                      <Link key={blog.id} href={`/blogs/${blog.id}`}>
                        <div className={commonLinkClasses}>
                          <div className="relative w-full h-56">
                            {blog.coverImage ? (
                              <Image
                                src={blog.coverImage}
                                alt={blog.title || "Blog post cover image"}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-500 group-hover:scale-105"
                                unoptimized={true}
                                priority={index < POSTS_PER_PAGE / 2} // Prioritize first few images
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-16 w-16 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <h2
                              className="text-2xl font-semibold text-white mb-2 group-hover:text-primary-light transition-colors duration-300 truncate"
                              title={blog.title}
                            >
                              {blog.title}
                            </h2>
                            <p className="text-sm text-gray-200 mb-4">
                              Published on:{" "}
                              {blog.createdAt
                                ?.toDate()
                                .toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                            </p>
                            <div className="mt-4 flex justify-between">
                              <span className="inline-block text-primary-light text-sm font-semibold px-3 py-1 rounded-full group-hover:bg-primary-light group-hover:text-white transition-colors duration-300">
                                Read More &rarr;
                              </span>

                              {profile && profile?.role === "admin" && (
                                <div className="flex items-center gap-2">
                                  {blog.archived && (
                                    <div className=" h-fit p-1 text-primary text-normal4 rounded bg-primary/20 border border-primary">
                                      archieved
                                    </div>
                                  )}
                                  <Link
                                    href={`/blogs/${blog.id}/edit`}
                                    legacyBehavior
                                  >
                                    <span className="text-gray-200 text-xs hover:text-primary transition-colors duration-300">
                                      <EditIcon />
                                    </span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                )}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="gap-y-6">
                {blogs.map(
                  (blog, index) =>
                    (!blog.archived || profile?.role === "admin") &&
                    blog.id != "HhrqYszvCsMXXo2gywSO" && (
                      <Link key={blog.id} href={`/blogs/${blog.id}`}>
                        <div
                          className={`${commonLinkClasses} flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 sm:p-6`}
                        >
                          <div className="relative w-full sm:w-40 h-40 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                            {blog.coverImage ? (
                              <Image
                                src={blog.coverImage}
                                alt={blog.title || "Blog post cover image"}
                                layout="fill"
                                objectFit="cover"
                                className="transition-transform duration-500 group-hover:scale-105"
                                unoptimized={true}
                                priority={index < POSTS_PER_PAGE / 2}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-12 w-12 text-gray-400"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow text-center sm:text-left">
                            <h2
                              className="text-xl md:text-2xl font-semibold text-white mb-1 group-hover:text-primary-light transition-colors duration-300"
                              title={blog.title}
                            >
                              {blog.title}
                            </h2>
                            <p className="text-xs text-gray-200 mb-3">
                              Published on:{" "}
                              {blog.createdAt
                                ?.toDate()
                                .toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                            </p>
                            <div className="flex justify-between">
                              <span className="inline-block text-primary-light text-sm font-semibold group-hover:underline">
                                Read More &rarr;
                              </span>

                              {profile?.role === "admin" && (
                                <div className="flex items-center gap-2">
                                  {blog.archived && (
                                    <div className=" h-fit p-1 text-primary text-normal4 rounded bg-primary/20 border border-primary">
                                      archieved
                                    </div>
                                  )}
                                  <Link
                                    href={`/blogs/${blog.id}/edit`}
                                    legacyBehavior
                                  >
                                    <span className="text-gray-200 text-xs hover:text-primary transition-colors duration-300">
                                      <EditIcon />
                                    </span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPosts > POSTS_PER_PAGE && (
              <div className="mt-12 flex justify-center items-center space-x-4">
                <button
                  onClick={() => fetchBlogData("prev")}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  &larr; Previous
                </button>
                <span className="text-gray-700">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchBlogData("next")}
                  disabled={currentPage >= totalPages || loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
};

export default BlogsPage;
