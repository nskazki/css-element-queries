/**
 * Copyright Marc J. Schmidt. See the LICENSE file at the top-level
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.ElementQueries = factory();
        root.ElementQueries.listen();
    }
}(typeof window !== 'undefined' ? window : this, function () {

    /**
     *
     * @type {Function}
     * @constructor
     */
    const ElementQueries = function() {
        /**
         *
         * @param element
         * @returns {Number}
         */
        function getEmSize(element) {
            if (!element) {
                element = document.documentElement;
            }
            const fontSize = window.getComputedStyle(element, null).fontSize;
            return parseFloat(fontSize) || 16;
        }

        /**
         *
         * @copyright https://github.com/Mr0grog/element-query/blob/master/LICENSE
         *
         * @param {HTMLElement} element
         * @param {*} value
         * @returns {*}
         */
        function convertToPx(element, value) {
            const numbers = value.split(/\d/);
            const units = numbers[numbers.length-1];
            value = parseFloat(value);
            switch (units) {
            case 'px':
                return value;
            case 'em':
                return value * getEmSize(element);
            case 'rem':
                return value * getEmSize();
                // Viewport units!
                // According to http://quirksmode.org/mobile/tableViewport.html
                // documentElement.clientWidth/Height gets us the most reliable info
            case 'vw':
                return value * document.documentElement.clientWidth / 100;
            case 'vh':
                return value * document.documentElement.clientHeight / 100;
            case 'vmin':
            case 'vmax': {
                const vw = document.documentElement.clientWidth / 100;
                const vh = document.documentElement.clientHeight / 100;
                const chooser = Math[units === 'vmin' ? 'min' : 'max'];
                return value * chooser(vw, vh);
            }
            default:
                return value;
                // for now, not supporting physical units (since they are just a set number of px)
                // or ex/ch (getting accurate measurements is hard)
            }
        }

        /**
         *
         * @param {HTMLElement} element
         * @constructor
         */
        function SetupInformation(element) {
            this.element = element;
            this.options = {};

            /**
             * @param {Object} option {mode: 'min|max', property: 'width|height', value: '123px'}
             */
            this.addOption = function(option) {
                const idx = [option.mode, option.property, option.value].join(',');
                this.options[idx] = option;
            };

            const attributes = ['min-width', 'min-height', 'max-width', 'max-height'];

            /**
             * Extracts the computed width/height and sets to min/max- attribute.
             */
            this.call = function() {
                // extract current dimensions
                const width = this.element.offsetWidth;
                const height = this.element.offsetHeight;
                const attrValues = {};

                for (const key in this.options) {
                    if (!this.options.hasOwnProperty(key)){
                        continue;
                    }
                    const option = this.options[key];
                    const value = convertToPx(this.element, option.value);

                    const actualValue = option.property === 'width' ? width : height;
                    const attrName = option.mode + '-' + option.property;
                    let attrValue = '';

                    if (option.mode === 'min' && actualValue >= value) {
                        attrValue += option.value;
                    }

                    if (option.mode === 'max' && actualValue <= value) {
                        attrValue += option.value;
                    }

                    if (!attrValues[attrName]) attrValues[attrName] = '';
                    if (attrValue && -1 === (' '+attrValues[attrName]+' ').indexOf(' ' + attrValue + ' ')) {
                        attrValues[attrName] += ' ' + attrValue;
                    }
                }

                for (const k in attributes) {
                    if(!attributes.hasOwnProperty(k)) continue;

                    if (attrValues[attributes[k]]) {
                        this.element.setAttribute(attributes[k], attrValues[attributes[k]].substr(1));
                    } else {
                        this.element.removeAttribute(attributes[k]);
                    }
                }
            };
        }

        /**
         * @param {HTMLElement} element
         * @param {Object}      options
         */
        function setupElement(element, options) {
            if (element.elementQueriesSetupInformation) {
                element.elementQueriesSetupInformation.addOption(options);
            } else {
                element.elementQueriesSetupInformation = new SetupInformation(element);
                element.elementQueriesSetupInformation.addOption(options);
                // TODO
                // element.elementQueriesSensor = new ResizeSensor(element, function() {
                // element.elementQueriesSetupInformation.call();
                // });
            }
            element.elementQueriesSetupInformation.call();
        }

        /**
         * @param {String} selector
         * @param {String} mode min|max
         * @param {String} property width|height
         * @param {String} value
         */
        const allQueries = {};
        function queueQuery(selector, mode, property, value) {
            if (typeof(allQueries[mode]) === 'undefined') allQueries[mode] = {};
            if (typeof(allQueries[mode][property]) === 'undefined') allQueries[mode][property] = {};
            if (typeof(allQueries[mode][property][value]) === 'undefined') allQueries[mode][property][value] = selector;
            else allQueries[mode][property][value] += ','+selector;
        }

        function getQuery() {
            let query;
            if (document.querySelectorAll) query = document.querySelectorAll.bind(document);
            if (!query && 'undefined' !== typeof window.$$) query = window.$$;
            if (!query && 'undefined' !== typeof window.jQuery) query = window.jQuery;

            if (!query) {
                throw 'No document.querySelectorAll, jQuery or Mootools\'s $$ found.';
            }

            return query;
        }

        /**
         * Start the magic. Go through all collected rules (readRules()) and attach the resize-listener.
         */
        function findElementQueriesElements() {
            const query = getQuery();

            for (const mode in allQueries) if (allQueries.hasOwnProperty(mode)) {

                for (const property in allQueries[mode]) if (allQueries[mode].hasOwnProperty(property)) {
                    for (const value in allQueries[mode][property]) if (allQueries[mode][property].hasOwnProperty(value)) {
                        const elements = query(allQueries[mode][property][value]);
                        for (let i = 0, j = elements.length; i < j; i++) {
                            setupElement(elements[i], {
                                mode: mode,
                                property: property,
                                value: value
                            });
                        }
                    }
                }

            }
        }

        const regex = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:min|max)-(?:width|height)[\s\t]*?[~$^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s{]*)/mgi;
        const attrRegex = /\[[\s\t]*?(min|max)-(width|height)[\s\t]*?[~$^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;
        /**
         * @param {String} css
         */
        function extractQuery(css) {
            let match;
            css = css.replace(/'/g, '"');
            while (null !== (match = regex.exec(css))) {
                const smatch = match[1] + match[3];
                const attrs = match[2];
                let attrMatch;

                while (null !== (attrMatch = attrRegex.exec(attrs))) {
                    queueQuery(smatch, attrMatch[1], attrMatch[2], attrMatch[3]);
                }
            }
        }

        /**
         * @param {CssRule[]|String} rules
         */
        function readRules(rules) {
            if (!rules) {
                return;
            }
            if ('string' === typeof rules) {
                rules = rules.toLowerCase();
                if (-1 !== rules.indexOf('min-width') || -1 !== rules.indexOf('max-width')) {
                    extractQuery(rules);
                }
            } else {
                for (let i = 0, j = rules.length; i < j; i++) {
                    if (1 === rules[i].type) {
                        const selector = rules[i].selectorText || rules[i].cssText;
                        if (-1 !== selector.indexOf('min-height') || -1 !== selector.indexOf('max-height')) {
                            extractQuery(selector);
                        }else if(-1 !== selector.indexOf('min-width') || -1 !== selector.indexOf('max-width')) {
                            extractQuery(selector);
                        }
                    } else if (4 === rules[i].type) {
                        readRules(rules[i].cssRules || rules[i].rules);
                    } else if (3 === rules[i].type) {
                        readRules(rules[i].styleSheet.cssRules);
                    }
                }
            }
        }

        /**
         * Searches all css rules and setups the event listener to all elements with element query rules..
         */
        this.init = function() {
            for (let i = 0, j = document.styleSheets.length; i < j; i++) {
                try {
                    readRules(document.styleSheets[i].cssRules || document.styleSheets[i].rules || document.styleSheets[i].cssText);
                } catch(e) {
                    if (e.name !== 'SecurityError') {
                        throw e;
                    }
                }
            }

            findElementQueriesElements();
        };

        this.update = function() {
            this.init();
        };
    };

    ElementQueries.update = function() {
        ElementQueries.instance.update();
    };

    ElementQueries.init = function() {
        if (!ElementQueries.instance) {
            ElementQueries.instance = new ElementQueries();
        }

        ElementQueries.instance.init();
    };

    const domLoaded = function (callback) {
        /* Internet Explorer */
        /*@cc_on
         @if (@_win32 || @_win64)
         document.write('<script id="ieScriptLoad" defer src="//:"><\/script>');
         document.getElementById('ieScriptLoad').onreadystatechange = function() {
         if (this.readyState === 'complete') {
         callback();
         }
         };
         @end @*/
        /* Mozilla, Chrome, Opera */
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', callback, false);
        }
        /* Safari, iCab, Konqueror */
        else if (/KHTML|WebKit|iCab/i.test(window.navigator.userAgent)) {
            const DOMLoadTimer = setInterval(function () {
                if (/loaded|complete/i.test(document.readyState)) {
                    callback();
                    clearInterval(DOMLoadTimer);
                }
            }, 10);
        }
        /* Other web browsers */
        else window.onload = callback;
    };

    ElementQueries.listen = function() {
        domLoaded(ElementQueries.init);
    };

    return ElementQueries;

}));
