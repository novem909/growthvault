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

        const value = typeof text === 'string' ? text : String(text ?? '');
        const plain = this.extractTextFromHtml(value);
        const trimmed = plain.trim();
        
        if (trimmed.length < minLength) {
            return { 
                valid: false, 
                error: `Text must be at least ${minLength} character${minLength > 1 ? 's' : ''}` 
            };
        }

        if (plain.length > maxLength) {
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
        if (item.text && this.extractTextFromHtml(item.text).trim().length > 0) {
            const textCheck = this.validateText(item.text, 0, 50000);
            if (!textCheck.valid) {
                errors.push(textCheck.error);
            }
        }

        // Either text or image must be provided
        const hasText = this.extractTextFromHtml(item.text || '').trim().length > 0;
        if (!hasText && !item.image) {
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
        return this.sanitizeRichText(html);
    }

    /**
     * Sanitize rich text content, preserving allowed formatting
     * @param {string} html
     * @returns {string}
     */
    static sanitizeRichText(html) {
        if (html === null || html === undefined) return '';
        if (typeof html !== 'string') {
            html = String(html);
        }
        if (!html.trim()) {
            return '';
        }

        let content = html;
        const containsHtml = /<\/?[a-z][\s\S]*>/i.test(content);

        if (!containsHtml) {
            content = this.convertMarkdownToHtml(content);
        }

        const template = document.createElement('template');
        template.innerHTML = content;
        const allowedTags = new Set(CONFIG.ALLOWED_HTML_TAGS.map(tag => tag.toUpperCase()));
        const allowedAttributes = new Set(CONFIG.ALLOWED_HTML_ATTRIBUTES.map(attr => attr.toLowerCase()));

        const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT, null, false);
        const nodesToRemove = [];

        while (walker.nextNode()) {
            const element = walker.currentNode;
            const tagName = element.tagName.toUpperCase();

            if (!allowedTags.has(tagName)) {
                if (tagName === 'DIV') {
                    const paragraph = document.createElement('p');
                    while (element.firstChild) {
                        paragraph.appendChild(element.firstChild);
                    }
                    element.parentNode?.replaceChild(paragraph, element);
                } else {
                    nodesToRemove.push(element);
                }
                continue;
            }

            // Remove all attributes that are not explicitly allowed
            Array.from(element.attributes).forEach(attr => {
                if (!allowedAttributes.has(attr.name.toLowerCase())) {
                    element.removeAttribute(attr.name);
                }
            });
        }

        nodesToRemove.forEach(node => {
            const parent = node.parentNode;
            if (!parent) return;
            while (node.firstChild) {
                parent.insertBefore(node.firstChild, node);
            }
            parent.removeChild(node);
        });

        let sanitized = template.innerHTML
            .replace(/<p>\s*<\/p>/gi, '')
            .replace(/\u200B/g, '')
            .trim();

        if (!sanitized) {
            return '';
        }

        const hasHtml = /<\/?[a-z][\s\S]*>/i.test(sanitized);
        if (!hasHtml) {
            sanitized = sanitized.replace(/\r?\n/g, '<br>').trim();
        }

        return this.applyInlineMarkdown(sanitized);
    }

    /**
     * Extract plain text content from HTML
     * @param {string} html
     * @returns {string}
     */
    static extractTextFromHtml(html) {
        if (html === null || html === undefined) return '';
        if (typeof html !== 'string') {
            html = String(html);
        }
        if (!html.trim()) {
            return '';
        }
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content.textContent || '';
    }

    /**
     * Convert basic Markdown formatting to HTML
     * Supports bold (**, __), italics (*, _), and inline code (`)
     * @param {string} text
     * @returns {string}
     */
    static convertMarkdownToHtml(text) {
        if (!text) return '';

        const escaped = this.escapeHtml(text);
        const converted = this.convertInlineMarkdownText(escaped);
        return converted.replace(/\r?\n/g, '<br>');
    }

    /**
     * Escape HTML entities in plain text
     * @param {string} text
     * @returns {string}
     */
    static escapeHtml(text) {
        return text.replace(/[&<>"']/g, (char) => {
            switch (char) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return char;
            }
        });
    }

    /**
     * Apply inline markdown transformations to existing HTML content
     * @param {string} html
     * @returns {string}
     */
    static applyInlineMarkdown(html) {
        if (!html) return '';

        const template = document.createElement('template');
        template.innerHTML = html;

        const disallowedParents = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE']);
        const walker = document.createTreeWalker(
            template.content,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (!node?.nodeValue) return NodeFilter.FILTER_REJECT;
                    if (!/[\*_`]/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
                    let parent = node.parentElement;
                    while (parent) {
                        if (disallowedParents.has(parent.tagName)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        parent = parent.parentElement;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        nodes.forEach((node) => {
            const original = node.textContent;
            const converted = this.convertInlineMarkdownText(original);
            if (converted !== original) {
                const fragment = document.createElement('template');
                fragment.innerHTML = converted;
                node.replaceWith(fragment.content);
            }
        });

        return template.innerHTML;
    }

    /**
     * Convert inline markdown markers within a string to HTML tags
     * @param {string} text
     * @returns {string}
     */
    static convertInlineMarkdownText(text) {
        if (!text || (text.indexOf('*') === -1 && text.indexOf('_') === -1 && text.indexOf('`') === -1)) {
            return text;
        }

        let result = text;

        // Bold **text** or __text__
        result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        result = result.replace(/__(.+?)__/g, '<strong>$1</strong>');

        // Italic *text* or _text_
        result = result.replace(/\*(?!\*)([^*\r\n]+?)\*/g, '<em>$1</em>');
        result = result.replace(/_(?!_)([^_\r\n]+?)_/g, '<em>$1</em>');

        // Inline code `text`
        result = result.replace(/`([^`\r\n]+)`/g, '<code>$1</code>');

        return result;
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

