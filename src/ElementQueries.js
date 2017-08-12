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
        root.meq = factory();
        root.meq.listen();
    }
}(typeof window !== 'undefined' ? window : this, function () {

    /**
     *
     * @type {Function}
     * @constructor
     */
    const channels = {};
    const meq = function() {
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
                const idx = option.idx;
                if (this.options.hasOwnProperty(idx))
                    return false;

                const channelName = option.channelName;
                this.options[idx] = option;
                if (!channels.hasOwnProperty(channelName))
                    channels[channelName] = [];
                const channel = channels[channelName];
                if (channel.indexOf(this.element) === -1)
                    channel.push(this.element);
                return true;
            };


            /**
             * Extracts the computed width/height and sets to min/max- attribute.
             */
            this.call = function() {
                // extract current dimensions
                const width = this.element.hasAttribute('meq-quick-width')
                    ? this.element.getAttribute('meq-quick-width')
                    : this.element.offsetWidth;
                const height = this.element.hasAttribute('meq-quick-height')
                    ? this.element.getAttribute('meq-quick-height')
                    : this.element.offsetHeight;

                const attrValues = {};

                for (const optionKey in this.options) if (this.options.hasOwnProperty(optionKey)) {
                    const option = this.options[optionKey];
                    const channelName = option.channelName;
                    const value = convertToPx(this.element, option.value);

                    const actualValue = option.property === 'width' ? width : height;
                    const attrName = channelName + '-meq-' + option.mode + '-' + option.property;
                    let attrValue = '';

                    if (option.mode === 'min' && actualValue >= value) {
                        attrValue += option.value;
                    }

                    if (option.mode === 'max' && actualValue <= value) {
                        attrValue += option.value;
                    }

                    if (!attrValues.hasOwnProperty(attrName)) {
                        attrValues[attrName] = '';
                    }

                    const attrValueNotEmpty = attrValue.length !== -1;
                    const attrValueNotIncluded = (' ' + attrValues[attrName] + ' ').indexOf(' ' + attrValue + ' ') === -1;
                    if (attrValueNotEmpty && attrValueNotIncluded) {
                        attrValues[attrName] += ' ' + attrValue + ' ';
                    }
                }

                for (const optionKey in this.options) if (this.options.hasOwnProperty(optionKey)) {
                    const option = this.options[optionKey];
                    const optAttrs = option.optAttrs;
                    for (let attrIndex = 0; attrIndex !== optAttrs.length; attrIndex++) {
                        const attrName = optAttrs[attrIndex];
                        this.element.removeAttribute(attrName);
                    }
                }

                for (const attrName in attrValues) if (attrValues.hasOwnProperty(attrName)) {
                    const attrValue = attrValues[attrName];
                    this.element.setAttribute(attrName, attrValue);
                }
            };
        }

        /**
         * @param {HTMLElement} element
         * @param {Object}      options
         */
        function setupElement(element, options) {
            if (element.elementQueriesSetupInformation) {
                if (element.elementQueriesSetupInformation.addOption(options))
                    element.elementQueriesSetupInformation.call();
            } else {
                element.elementQueriesSetupInformation = new SetupInformation(element);
                if (element.elementQueriesSetupInformation.addOption(options))
                    element.elementQueriesSetupInformation.call();
            }
        }

        /**
         * @param {String} selector
         * @param {String} mode min|max
         * @param {String} property width|height
         * @param {String} value
         */
        const allQueries = {};
        function queueQuery(selector, channelName, mode, property, value) {
            if (typeof(allQueries[channelName]) === 'undefined') allQueries[channelName] = {};
            if (typeof(allQueries[channelName][mode]) === 'undefined') allQueries[channelName][mode] = {};
            if (typeof(allQueries[channelName][mode][property]) === 'undefined') allQueries[channelName][mode][property] = {};
            if (typeof(allQueries[channelName][mode][property][value]) === 'undefined') allQueries[channelName][mode][property][value] = selector;
            else allQueries[channelName][mode][property][value] += ','+selector;
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
            const baseAttrs = ['meq-min-width', 'meq-min-height', 'meq-max-width', 'meq-max-height'];
            for (const channelName in allQueries) if (allQueries.hasOwnProperty(channelName)) {
                const optAttrs = baseAttrs.map(attrName => channelName + '-' + attrName);
                for (const mode in allQueries[channelName]) if (allQueries[channelName].hasOwnProperty(mode)) {
                    for (const property in allQueries[channelName][mode]) if (allQueries[channelName][mode].hasOwnProperty(property)) {
                        for (const value in allQueries[channelName][mode][property]) if (allQueries[channelName][mode][property].hasOwnProperty(value)) {
                            const elements = query(allQueries[channelName][mode][property][value]);
                            const idx = channelName + mode + property + value;
                            const option = {
                                idx,
                                mode,
                                value,
                                property,
                                optAttrs,
                                channelName
                            };
                            for (let i = 0, j = elements.length; i < j; i++) {
                                setupElement(elements[i], option);
                            }
                        }
                    }
                }
            }
        }

        const regex = /,?[\s\t]*([^,\n]*?)((?:\[[\s\t]*?(?:[\w-]+)-meq-(?:min|max)-(?:width|height)[\s\t]*?[~$^]?=[\s\t]*?"[^"]*?"[\s\t]*?])+)([^,\n\s{]*)/mgi;
        const attrRegex = /\[[\s\t]*?([\w-]+)-meq-(min|max)-(width|height)[\s\t]*?[~$^]?=[\s\t]*?"([^"]*?)"[\s\t]*?]/mgi;
        /**
         * @param {String} css
         */
        function extractQuery(css) {
            css = css.replace(/'/g, '"');
            let match;
            while (null !== (match = regex.exec(css))) {
                const smatch = match[1] + match[3];
                const attrs = match[2];
                let attrMatch;

                while (null !== (attrMatch = attrRegex.exec(attrs))) {
                    queueQuery(smatch, attrMatch[1], attrMatch[2], attrMatch[3], attrMatch[4]);
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
                if (-1 !== rules.indexOf('meq-min-width') || -1 !== rules.indexOf('meq-max-width')) {
                    extractQuery(rules);
                }
            } else {
                for (let i = 0, j = rules.length; i < j; i++) {
                    if (1 === rules[i].type) {
                        const selector = rules[i].selectorText || rules[i].cssText;
                        if (-1 !== selector.indexOf('meq-min-height') || -1 !== selector.indexOf('meq-max-height')) {
                            extractQuery(selector);
                        }else if(-1 !== selector.indexOf('meq-min-width') || -1 !== selector.indexOf('meq-max-width')) {
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

        this.findElements = function() {
            findElementQueriesElements();
        };
    };

    meq.update = function() {
        meq.instance.update();
    };

    meq.init = function() {
        if (!meq.instance) {
            meq.instance = new meq();
        }

        meq.instance.init();
    };

    meq.findElements = function() {
        meq.instance.findElements();
    };

    meq.recalc = function(channelName) {
        if (channelName instanceof window.Element)
            return meq.recalcByElm(channelName);

        const channelArr = channelName && channelName.length !== 0
            ? [ channels[channelName] ]
            : Object.keys(channels).map(key => channels[key]);

        channelArr.forEach(channel => {
            if (channel) {
                for (let elmIndex = 0; elmIndex !== channel.length; elmIndex++) {
                    const elm = channel[elmIndex];
                    if (elm.elementQueriesSetupInformation)
                        elm.elementQueriesSetupInformation.call();
                }
            }
        });
    };

    meq.recalcByElm = function(elm) {
        if (elm.elementQueriesSetupInformation)
            elm.elementQueriesSetupInformation.call();
    };

    meq.channels = channels;

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

    meq.listen = function() {
        domLoaded(meq.init);
    };

    return meq;

}));
