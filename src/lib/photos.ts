export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'] as const;

export function photoError(file: File): string | null {
	if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
		return `${file.name} is not a JPG or PNG image.`;
	}
	if (file.size > MAX_PHOTO_BYTES) return `${file.name} is larger than 10MB.`;
	return null;
}

export function photoUrl(objectKey: string) {
	return `/uploads/${objectKey}`;
}
