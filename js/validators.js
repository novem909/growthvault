/**
 * GrowthVault - Validators
 * Input validation utilities
 */

import { CONFIG } from './config.js';

export class Validators {
    /**
     * Validate text input
     * @param {string} text - Text to validate
     * @param {number} minLength - Minimum length (default 1)
     * @param {number} maxLength - Maximum length (default 10000)
     * @returns {Object} {valid: boolean, error?: string}
     */
    static validateText(text, minLength = 1, maxLength = 10000) {
        if (text === null || text === undefined) {
            return { valid: false, error: 'Text is required' };
        }

        const trimmed = text.trim();
        
        if (trimmed.length < minLength) {
            return { 
                valid: false, 
                error: `Text must be at least ${minLength} character${minLength > 1 ? 's' : ''}` 
            };
        }

        if (text.length > maxLength) {
            return { 
                valid: false, 
                error: `Text must be less than ${maxLength} characters` 
            };
        }

        return { valid: true };
    }

    /**
     * Validate author name
     * @param {string} author - Author name to validate
     * @returns {Object} {valid: boolean, error?: string}
     */
    static validateAuthor(author) {
        if (!author || author.trim().length === 0) {
            return { valid: false, error: 'Author name is required' };
        }

        if (author.length > 100) {
            return { valid: false, error: 'Author name must be less than 100 characters' };
        }

        return { valid: true };
    }

    /**
     * Validate image file
     * @param {File} file - Image file to validate
     * @returns {Object} {valid: boolean, error?: string}
     */
    static validateImage(file) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        // Check file type
        if (!CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            return { 
                valid: false, 
                error: `Image must be one of: ${CONFIG.SUPPORTED_IMAGE_TYPES.join(', ')}` 
            };
        }

        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            const maxSizeMB = (CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(1);
            return { 
                valid: false, 
                error: `Image must be less than ${maxSizeMB}MB` 
            };
        }

        return { valid: true };
    }

    /**
     * Validate item data before adding/updating
     * @param {Object} item - Item object to validate
     * @returns {Object} {valid: boolean, errors: Array}
     */
    static validateItem(item) {
        const errors = [];

        // Validate author
        const authorCheck = this.validateAuthor(item.author);
        if (!authorCheck.valid) {
            errors.push(authorCheck.error);
        }

        // Validate text (if provided)
        if (item.text && item.text.trim().length > 0) {
            const textCheck = this.validateText(item.text, 0, 50000);
            if (!textCheck.valid) {
                errors.push(textCheck.error);
            }
        }

        // Either text or image must be provided
        if ((!item.text || item.text.trim().length === 0) && !item.image) {
            errors.push('Either text or image must be provided');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize HTML to prevent XSS
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    static sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Validate JSON import data
     * @param {Object} data - Data object to validate
     * @returns {Object} {valid: boolean, error?: string}
     */
    static validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid data format' };
        }

        if (!Array.isArray(data.items)) {
            return { valid: false, error: 'Data must contain an items array' };
        }

        // Validate each item
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            if (!item.id || !item.author) {
                return { 
                    valid: false, 
                    error: `Invalid item at index ${i}: missing required fields` 
                };
            }
        }

        return { valid: true };
    }
}

export default Validators;

