import type { Attrs, Node } from "@tiptap/pm/model";
import {
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  StorageReference,
  UploadTask,
} from "firebase/storage";
import { storage } from "@/lib/firebase/ClientApp";
import type { Editor } from "@tiptap/react";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Checks if a mark exists in the editor schema
 * @param markName - The name of the mark to check
 * @param editor - The editor instance
 * @returns boolean indicating if the mark exists in the schema
 */
export const isMarkInSchema = (
  markName: string,
  editor: Editor | null
): boolean => {
  if (!editor?.schema) return false;
  return editor.schema.spec.marks.get(markName) !== undefined;
};

/**
 * Checks if a node exists in the editor schema
 * @param nodeName - The name of the node to check
 * @param editor - The editor instance
 * @returns boolean indicating if the node exists in the schema
 */
export const isNodeInSchema = (
  nodeName: string,
  editor: Editor | null
): boolean => {
  if (!editor?.schema) return false;
  return editor.schema.spec.nodes.get(nodeName) !== undefined;
};

/**
 * Gets the active attributes of a specific mark in the current editor selection.
 *
 * @param editor - The Tiptap editor instance.
 * @param markName - The name of the mark to look for (e.g., "highlight", "link").
 * @returns The attributes of the active mark, or `null` if the mark is not active.
 */
export function getActiveMarkAttrs(
  editor: Editor | null,
  markName: string
): Attrs | null {
  if (!editor) return null;
  const { state } = editor;
  const marks = state.storedMarks || state.selection.$from.marks();
  const mark = marks.find((mark) => mark.type.name === markName);

  return mark?.attrs ?? null;
}

/**
 * Checks if a node is empty
 */
export function isEmptyNode(node?: Node | null): boolean {
  return !!node && node.content.size === 0;
}

/**
 * Utility function to conditionally join class names into a single string.
 * Filters out falsey values like false, undefined, null, and empty strings.
 *
 * @param classes - List of class name strings or falsey values.
 * @returns A single space-separated string of valid class names.
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Finds the position and instance of a node in the document
 * @param props Object containing editor, node (optional), and nodePos (optional)
 * @param props.editor The TipTap editor instance
 * @param props.node The node to find (optional if nodePos is provided)
 * @param props.nodePos The position of the node to find (optional if node is provided)
 * @returns An object with the position and node, or null if not found
 */
export function findNodePosition(props: {
  editor: Editor | null;
  node?: Node | null;
  nodePos?: number | null;
}): { pos: number; node: Node } | null {
  const { editor, node, nodePos } = props;

  if (!editor || !editor.state?.doc) return null;

  // Zero is valid position
  const hasValidNode = node !== undefined && node !== null;
  const hasValidPos = nodePos !== undefined && nodePos !== null;

  if (!hasValidNode && !hasValidPos) {
    return null;
  }

  if (hasValidPos) {
    try {
      const nodeAtPos = editor.state.doc.nodeAt(nodePos!);
      if (nodeAtPos) {
        return { pos: nodePos!, node: nodeAtPos };
      }
    } catch (error) {
      console.error("Error checking node at position:", error);
      return null;
    }
  }

  // Otherwise search for the node in the document
  let foundPos = -1;
  let foundNode: Node | null = null;

  editor.state.doc.descendants((currentNode, pos) => {
    // TODO: Needed?
    // if (currentNode.type && currentNode.type.name === node!.type.name) {
    if (currentNode === node) {
      foundPos = pos;
      foundNode = currentNode;
      return false;
    }
    return true;
  });

  return foundPos !== -1 && foundNode !== null
    ? { pos: foundPos, node: foundNode }
    : null;
}

/**
 * Handles image upload to Firebase Storage with progress tracking and abort capability
 * @param file The file to upload
 * @param onProgress Optional callback for tracking upload progress
 * @param abortSignal Optional AbortSignal for cancelling the upload
 * @returns Promise resolving to the URL of the uploaded image
 */
export const handleImageUpload = async (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  abortSignal?: AbortSignal
): Promise<string> => {
  const restaurantId = process.env.NEXT_PUBLIC_FIREBASE_RESTAURANT_ID;

  if (!file) {
    throw new Error("No file provided");
  }
  if (!restaurantId) {
    throw new Error("Restaurant ID is required for image upload path.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`
    );
  }
  const filePath = `restaurant_assets/${restaurantId}/tiptap_temp_images/${Date.now()}_${file.name}`;
  const imageStorageRef: StorageReference = storageRef(storage, filePath);

  // Upload the file
  const uploadTask: UploadTask = uploadBytesResumable(imageStorageRef, file);

  // Monitor progress (optional)
  if (onProgress) {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({ progress: parseFloat(progress.toFixed(2)) });
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error("Firebase Storage Upload Error:", error);
        throw error;
      }
    );
  }

  // Handle abort signal
  if (abortSignal) {
    const abortListener = () => {
      uploadTask.cancel();
      console.log("Upload cancelled by AbortSignal.");
      throw new Error("Upload cancelled by user.");
    };
    abortSignal.addEventListener("abort", abortListener);

    // Clean up the listener once the task is complete (success or failure)
    uploadTask
      .then(() => {
        abortSignal.removeEventListener("abort", abortListener);
      })
      .catch(() => {
        abortSignal.removeEventListener("abort", abortListener);
      });
  }

  // Wait for upload to complete and get download URL
  try {
    await uploadTask;
    const downloadURL = await getDownloadURL(imageStorageRef);
    return downloadURL;
  } catch (error) {
    throw error;
  }
};

/**
 * Converts a File to base64 string
 * @param file The file to convert
 * @param abortSignal Optional AbortSignal for cancelling the conversion
 * @returns Promise resolving to the base64 representation of the file
 */
export const convertFileToBase64 = (
  file: File,
  abortSignal?: AbortSignal
): Promise<string> => {
  if (!file) {
    return Promise.reject(new Error("No file provided"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const abortHandler = () => {
      reader.abort();
      reject(new Error("Upload cancelled"));
    };

    if (abortSignal) {
      abortSignal.addEventListener("abort", abortHandler);
    }

    reader.onloadend = () => {
      if (abortSignal) {
        abortSignal.removeEventListener("abort", abortHandler);
      }

      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert File to base64"));
      }
    };

    reader.onerror = (error) =>
      reject(new Error(`File reading error: ${error}`));
    reader.readAsDataURL(file);
  });
};
