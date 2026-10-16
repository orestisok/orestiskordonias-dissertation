export const CATEGORY_COLORS = [
	'#2a78d6',
	'#eb6834',
	'#1baf7a',
	'#eda100',
	'#e87ba4',
	'#008300',
	'#6250d6',
	'#e34948'
];

export const FALLBACK_CATEGORY_COLOR = '#898781';

export function categoryColor(index: number) {
	return CATEGORY_COLORS[index] ?? FALLBACK_CATEGORY_COLOR;
}
