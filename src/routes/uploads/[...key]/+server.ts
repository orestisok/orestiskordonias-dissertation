import { error } from '@sveltejs/kit';
import { readPhoto } from '$lib/server/storage';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401, 'Log in to view photos');

	const photo = await readPhoto(params.key);
	if (!photo) error(404, 'Not found');

	const headers = new Headers({
		'Content-Type': photo.contentType,
		'Cache-Control': 'private, max-age=31536000, immutable',
		'X-Content-Type-Options': 'nosniff'
	});
	if (photo.contentLength !== undefined) {
		headers.set('Content-Length', String(photo.contentLength));
	}

	return new Response(photo.body, { headers });
};
