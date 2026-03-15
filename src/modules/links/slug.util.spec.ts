import { generateSlug, isUrlSafe } from './slug.util';

describe('Slug Utilities', () => {
  describe('generateSlug', () => {
    it('should generate a slug of default length 6', () => {
      const slug = generateSlug();
      expect(slug).toHaveLength(6);
    });

    it('should generate a slug of specified length', () => {
      const slug = generateSlug(8);
      expect(slug).toHaveLength(8);
    });

    it('should only contain alphanumeric characters', () => {
      for (let i = 0; i < 20; i++) {
        const slug = generateSlug(6);
        expect(slug).toMatch(/^[A-Za-z0-9]+$/);
      }
    });

    it('should generate different slugs on successive calls', () => {
      const slugs = new Set(Array.from({ length: 10 }, () => generateSlug()));
      expect(slugs.size).toBeGreaterThan(1);
    });
  });

  describe('isUrlSafe', () => {
    it('should allow http URLs', () => {
      expect(isUrlSafe('http://example.com')).toBe(true);
    });

    it('should allow https URLs', () => {
      expect(isUrlSafe('https://example.com')).toBe(true);
    });

    it('should block javascript: URLs', () => {
      expect(isUrlSafe('javascript:alert(1)')).toBe(false);
    });

    it('should block javascript: URLs with uppercase', () => {
      expect(isUrlSafe('JavaScript:alert(1)')).toBe(false);
    });

    it('should block data: URLs', () => {
      expect(isUrlSafe('data:text/html,<h1>hi</h1>')).toBe(false);
    });

    it('should block file: URLs', () => {
      expect(isUrlSafe('file:///etc/passwd')).toBe(false);
    });
  });
});
