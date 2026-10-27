/**
 * UTM Tracking Helper for CLIMA
 * Appends UTM parameters to URLs for campaign tracking
 */

/**
 * Add UTM parameters to a URL
 * @param {string} url - The base URL
 * @param {string} source - utm_source (e.g., 'clima', 'newsletter')
 * @param {string} medium - utm_medium (e.g., 'web', 'email', 'social')
 * @param {string} campaign - utm_campaign (e.g., 'footer_link', 'advisory_cta')
 * @returns {string} URL with UTM parameters appended
 */
export function addUTMParams(url, source, medium, campaign) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', source);
    urlObj.searchParams.set('utm_medium', medium);
    urlObj.searchParams.set('utm_campaign', campaign);
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return original
    console.warn('Invalid URL for UTM tracking:', url);
    return url;
  }
}

/**
 * Add UTM parameters specifically for CLIMA web links
 * @param {string} url - The base URL
 * @param {string} campaign - utm_campaign
 * @returns {string} URL with CLIMA UTM parameters
 */
export function addCLIMAUTM(url, campaign) {
  return addUTMParams(url, 'clima', 'web', campaign);
}
