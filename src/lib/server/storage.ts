import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '$env/dynamic/private';
import { MAX_PHOTO_BYTES } from '$lib/photos';

// Local stand-in for object storage: an object key is a path relative to this folder
const root = path.resolve(env.UPLOADS_DIR || 'uploads');

const contentTypes: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png' };

// Trust the file's bytes, not the browser-supplied type or name
function sniffExtension(bytes: Uint8Array): string | null {
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
	const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (png.every((b, i) => bytes[i] === b)) return 'png';
	return null;
}

// Rejects keys that would escape the uploads folder (../, absolute paths)
function resolveKey(key: string) {
	const file = path.resolve(root, key);
	if (!file.startsWith(root + path.sep)) throw new Error(`Invalid object key: ${key}`);
	return file;
}

/** Writes the photo and returns its object key for report_photos.object_key. */
export async function saveReportPhoto(reportId: string, file: File) {
	if (file.size > MAX_PHOTO_BYTES) throw new Error('Photo is larger than 10MB');

	const bytes = new Uint8Array(await file.arrayBuffer());
	const ext = sniffExtension(bytes);
	if (!ext) throw new Error('Photo is not a JPG or PNG image');

	const key = `reports/${reportId}/${randomUUID()}.${ext}`;
	const target = resolveKey(key);
	await mkdir(path.dirname(target), { recursive: true });
	await writeFile(target, bytes, { flag: 'wx' });
	return key;
}

/** Returns the photo's bytes and content type, or null if it doesn't exist. */
export async function readPhoto(key: string) {
	let file: string;
	try {
		file = resolveKey(key);
	} catch {
		return null;
	}

	const contentType = contentTypes[path.extname(file).slice(1)];
	if (!contentType) return null;

	try {
		return { body: await readFile(file), contentType };
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw err;
	}
}

/** Removes every photo of a report; rows cascade in the db, files don't. */
export async function deleteReportPhotos(reportId: string) {
	await rm(resolveKey(`reports/${reportId}`), { recursive: true, force: true });
}
