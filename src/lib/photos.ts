// Shared by the upload UI and the server so both enforce the same limits
export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;

// Quick check on what the browser reports; the server also sniffs the bytes on save
export function photoError(file: File): string | null {
	if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
		return `${file.name} is not a JPG or PNG image.`;
	}
	if (file.size > MAX_PHOTO_BYTES) return `${file.name} is larger than 10MB.`;
	return null;
}

// Keys are stored in report_photos.object_key and served by routes/uploads
export function photoUrl(objectKey: string) {
	return `/uploads/${objectKey}`;
}
