/** Notes per guestbook page. The bottom-right cell is a tenth slot of its own, for the pad (spec 3.1). */
export const NOTES_PER_PAGE = 9;

/** Pages a guestbook needs: nine notes each, and always at least one page for the pad. */
export const pagesFor = (notes: number) => Math.max(1, Math.ceil(notes / NOTES_PER_PAGE));
