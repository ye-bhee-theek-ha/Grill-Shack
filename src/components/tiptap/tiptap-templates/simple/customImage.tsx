// customimage.tsx

import React from "react";
import {
	NodeViewWrapper,
	ReactNodeViewRenderer,
	NodeViewProps,
} from "@tiptap/react";
import { Image } from "@tiptap/extension-image";

function ImageNode(props: NodeViewProps) {
	console.log("ImageNode component is rendering!");

	const { src, alt, redirectUrl } = props.node.attrs;
	const { editor, updateAttributes, selected } = props;

	let className = "image";
	if (props.selected) {
		className += " ProseMirror-selectednode";
	}

	const handleAltTextChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		if (editor.isEditable) {
			updateAttributes({ alt: event.target.value });
		}
	};

	const handleRedirectUrlChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		if (editor.isEditable) {
			updateAttributes({ redirectUrl: event.target.value });
		}
	};

	// Determine if the controls should be visible
	const showControls = editor.isEditable && selected;

	console.log(redirectUrl, "redirectUrl");

	return (
		<NodeViewWrapper className={className} data-drag-handle>
			<div
				// Apply transitions to the outer container for smooth resizing
				// and border changes. Adjust duration and timing as needed.
				className={`
                    ${selected ? "border-primary border-2 " : ""}
                    rounded-lg overflow-hidden
                    transition-all duration-200 ease-in-out // Added duration and ease
                    ${showControls ? "pb-2" : "pb-0"} // Add padding when controls are visible
                `}
			>
				{redirectUrl ? (
					<a
						href={redirectUrl}
						target="_blank"
						rel="noopener noreferrer"
						// Prevent clicking the image from deselecting it
						onClick={(e) => {
							if (selected) e.preventDefault();
						}}
					>
						<img
							src={src}
							alt={alt}
							className="rounded-lg overflow-hidden w-full h-auto block" // Added w-full h-auto block for better image sizing
						/>
					</a>
				) : (
					<img
						src={src}
						alt={alt}
						className="rounded-lg overflow-hidden w-full h-auto block" // Added w-full h-auto block for better image sizing
					/>
				)}

				{/* Container for the alt and URL inputs */}
				<div
					className={`
                        transition-all duration-200 ease-in-out
                        ${showControls ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0"} // Smoothly reveal/hide
                    `}
					style={{ overflow: "hidden" }}
				>
					<div className="mx-4 mt-2">
						<span className="px-2 rounded-full bg-grey/20">
							alt:
						</span>
						<input
							type="text"
							placeholder="Enter alt text"
							value={alt || ""}
							onChange={handleAltTextChange}
							className="image-alt-input transition-all delay-75 py-2 focus:outline-0 mx-3 w-4/5" // Added w-4/5 for input width
							onClick={(e) => e.stopPropagation()}
							aria-label="Image alt text"
							tabIndex={showControls ? 0 : -1} // Make input unfocusable when hidden
						/>
					</div>
					<div className="mx-4 mt-2 mb-4">
						<span className="px-2 rounded-full bg-grey/20">
							URL:
						</span>
						<input
							type="text"
							placeholder="Enter redirect URL (optional)"
							value={redirectUrl || ""}
							onChange={handleRedirectUrlChange}
							className="image-alt-input transition-all delay-75 pt-2 focus:outline-0 mx-3 w-4/5" // Added w-4/5 for input width
							onClick={(e) => e.stopPropagation()}
							aria-label="Image redirect URL"
							tabIndex={showControls ? 0 : -1} // Make input unfocusable when hidden
						/>
					</div>
				</div>
			</div>
		</NodeViewWrapper>
	);
}

export default Image.extend({
	// Define custom attributes for the extension
	addAttributes() {
		return {
			...this.parent?.(),
			redirectUrl: {
				default: null,
				parseHTML: (element) => {
					const anchor = element.querySelector("a");
					return anchor ? anchor.getAttribute("href") : null;
				},
				renderHTML: (attributes) => {
					if (attributes.redirectUrl) {
						return {
							href: attributes.redirectUrl,
						};
					}
					return {};
				},
			},
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(ImageNode);
	},
});
