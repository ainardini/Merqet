// Returns all photos for a listing, preferring the new multi-photo array
// and falling back to the legacy single photoUrl field for older listings.
export function getListingPhotos(listing: { photoUrl?: string | null; photoUrls?: string[] }): string[] {
  if (listing.photoUrls && listing.photoUrls.length > 0) return listing.photoUrls;
  if (listing.photoUrl) return [listing.photoUrl];
  return [];
}

export const MAX_LISTING_PHOTOS = 5;
