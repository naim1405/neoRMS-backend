import slugify from 'slugify';
import { nanoid } from 'nanoid';

/**
 * Convert text into a clean URL-safe slug
 */
export const createSlug = (text: string): string => {
    return slugify(text, {
        lower: true,
        strict: true, // removes special characters
        trim: true,
    });
};

/**
 * Generate a short nanoid (default length = 8)
 */
export const generateNanoId = (length = 8): string => {
    return nanoid(length);
};

/**
 * Generate slug with nanoid appended
 * Example: hello-world-a8f92k
 */
export const generateSlugWithNanoId = (text: string, idLength = 6): string => {
    const baseSlug = createSlug(text);
    const id = generateNanoId(idLength);
    return `${baseSlug}-${id}`;
};
