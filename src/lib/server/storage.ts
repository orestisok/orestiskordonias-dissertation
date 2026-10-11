import { randomUUID } from 'node:crypto';
import {
	DeleteObjectsCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	NoSuchKey,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { MAX_PHOTO_BYTES } from '$lib/photos';

export class InvalidPhotoError extends Error {}

const contentTypes: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png' };
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const uuidPattern = new RegExp(`^${uuid}$`);
const keyPattern = new RegExp(`^reports/${uuid}/${uuid}\\.(jpg|png)$`);

let client: S3Client | undefined;

function r2() {
	const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env;
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
		throw new Error('R2 is not configured: set the R2_* variables in .env');
	}

	client ??= new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
		requestChecksumCalculation: 'WHEN_REQUIRED',
		responseChecksumValidation: 'WHEN_REQUIRED'
	});
	return { client, bucket: R2_BUCKET };
}

function sniffExtension(bytes: Uint8Array): string | null {
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
	const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	if (png.every((b, i) => bytes[i] === b)) return 'png';
	return null;
}

export async function saveReportPhoto(reportId: string, file: File) {
	if (!uuidPattern.test(reportId)) throw new Error(`Invalid report id: ${reportId}`);
	if (file.size > MAX_PHOTO_BYTES) {
		throw new InvalidPhotoError(`${file.name} is larger than 10MB.`);
	}

	const bytes = new Uint8Array(await file.arrayBuffer());
	const ext = sniffExtension(bytes);
	if (!ext) throw new InvalidPhotoError(`${file.name} is not a JPG or PNG image.`);

	const key = `reports/${reportId}/${randomUUID()}.${ext}`;
	const { client, bucket } = r2();
	await client.send(
		new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: contentTypes[ext] })
	);
	return key;
}

export async function readPhoto(key: string) {
	if (!keyPattern.test(key)) return null;

	const { client, bucket } = r2();
	try {
		const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
		if (!object.Body) return null;
		return {
			body: object.Body.transformToWebStream(),
			contentType: contentTypes[key.slice(key.lastIndexOf('.') + 1)],
			contentLength: object.ContentLength
		};
	} catch (err) {
		if (err instanceof NoSuchKey) return null;
		throw err;
	}
}

export async function deleteReportPhotos(reportId: string) {
	if (!uuidPattern.test(reportId)) throw new Error(`Invalid report id: ${reportId}`);

	const { client, bucket } = r2();
	let token: string | undefined;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: `reports/${reportId}/`,
				ContinuationToken: token
			})
		);
		const objects = (page.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
		if (objects.length) {
			await client.send(
				new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } })
			);
		}
		token = page.NextContinuationToken;
	} while (token);
}
