import ExpoAgeRange from './ExpoAgeRange';
/**
 * Prompts user to declare their age range.
 * @return A promise that resolves with user's age range response. Or rejects with an error (TODO vonovak export the error codes?).
 * @platform android
 * @platform ios 26.0+
 */
export async function requestAgeRangeAsync(options) {
    // TODO vonovak can just export the function directly?
    return ExpoAgeRange.requestAgeRangeAsync(options);
}
//# sourceMappingURL=AgeRange.js.map