import { error } from '@sveltejs/kit';
import { readPhoto } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const photo = await readPhoto(params.key);
	if (!photo) error(404, 'Not found');

	return new Response(photo.body, {
		headers: {
			'Content-Type': photo.contentType,
			'Content-Length': String(photo.body.byteLength),
			'Cache-Control': 'public, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
